import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AIRecommendation } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query: string = body.query ?? "";

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Returning fallback data.");
      return generateFallback(query);
    }

    // Fetch catalog to provide context to the AI
    let catalog = [];
    try {
      catalog = await prisma.product.findMany({
        select: { name: true, slug: true, description: true, category: true, price: true },
      });
    } catch (dbError) {
      console.error("Failed to fetch catalog for AI context:", dbError);
      return NextResponse.json(
        { error: "Database connection failed. Check your .env file." },
        { status: 500 }
      );
    }

    if (catalog.length === 0) {
      return NextResponse.json(
        { error: "Catalog is empty. Please run the database seed first." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert Smart Home and Smart Farming IoT assistant.
A user wants a hardware recommendation based on the following input: "${query}"

Here is our available catalog:
${JSON.stringify(catalog, null, 2)}

Your task is to recommend a curated package of hardware from the catalog that best solves the user's problem.
Respond ONLY with a valid JSON object adhering strictly to the following structure. Do not include markdown formatting like \`\`\`json.
{
  "packageName": "A creative, short name for the bundle (e.g. 'Kit Monitorizare Aer')",
  "description": "A 1-2 sentence explanation of why these products were chosen.",
  "productSlugs": ["slug1", "slug2"]
}
Only include slugs that exist in the provided catalog.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean markdown if present
    const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const aiResponse = JSON.parse(cleanJson) as {
      packageName: string;
      description: string;
      productSlugs: string[];
    };

    // Fetch the actual products based on recommended slugs
    const recommendedProducts = await prisma.product.findMany({
      where: { slug: { in: aiResponse.productSlugs } },
    });

    const totalPrice = recommendedProducts.reduce((sum, p) => sum + p.price, 0);

    const recommendation: AIRecommendation = {
      packageName: aiResponse.packageName || "Custom IoT Solution",
      description: aiResponse.description || "Based on your needs, we curated this package.",
      products: recommendedProducts,
      totalPrice,
    };

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("[AI_RECOMMEND_GEMINI]", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation. Please try again." },
      { status: 500 }
    );
  }
}

async function generateFallback(query: string) {
  try {
    const fallbackProducts = await prisma.product.findMany({
      take: 3,
      orderBy: { featured: "desc" },
    });
    
    const totalPrice = fallbackProducts.reduce((sum, p) => sum + p.price, 0);
    return NextResponse.json({
      packageName: "Starter Pack (Fallback)",
      description: "Gemini API key is missing. Showing featured products.",
      products: fallbackProducts,
      totalPrice,
    });
  } catch (e) {
    return NextResponse.json({ error: "DB Error" }, { status: 500 });
  }
}
