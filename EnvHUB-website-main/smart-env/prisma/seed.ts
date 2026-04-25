import { PrismaClient, Category } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "Motion Sensor",
    slug: "motion-sensor",
    description: "Motion sensors detect movement within a specific area and are often used for security, lighting control, and energy management.",
    price: 24.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["motion", "security", "lighting", "energy"],
    featured: true,
  },
  {
    name: "Door and Window Sensor",
    slug: "door-window-sensor",
    description: "Door and window sensors monitor the opening and closing of doors and windows, providing security and automation capabilities.",
    price: 19.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["door", "window", "security", "automation"],
    featured: false,
  },
  {
    name: "Temperature and Humidity Sensor",
    slug: "temp-humidity-sensor",
    description: "These sensors monitor the ambient temperature and humidity in a room, enabling climate control and energy management.",
    price: 29.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["temperature", "humidity", "climate", "energy"],
    featured: true,
  },
  {
    name: "Smoke and Carbon Monoxide (CO) Detector",
    slug: "smoke-co-detector",
    description: "These safety devices detect the presence of smoke or carbon monoxide in the air, alerting occupants and triggering emergency responses.",
    price: 49.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["smoke", "co", "carbon monoxide", "safety", "emergency"],
    featured: true,
  },
  {
    name: "Water Leak Sensor",
    slug: "water-leak-sensor",
    description: "Water leak sensors detect the presence of water or moisture, alerting homeowners to potential leaks or flooding.",
    price: 22.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["water", "leak", "moisture", "flood"],
    featured: false,
  },
  {
    name: "Light Sensor",
    slug: "light-sensor",
    description: "Light sensors, also known as ambient light sensors or lux sensors, measure the light intensity in a room.",
    price: 15.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["light", "lux", "ambient"],
    featured: false,
  },
  {
    name: "Air Quality Sensor",
    slug: "air-quality-sensor",
    description: "Air quality sensors monitor indoor air pollutants, such as volatile organic compounds (VOCs), particulate matter (PM), or CO2 levels.",
    price: 59.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["air quality", "voc", "co2", "pollution"],
    featured: true,
  },
  {
    name: "Noise Sensor",
    slug: "noise-sensor",
    description: "Noise sensors, also known as sound sensors or acoustic sensors, detect and measure sound levels in a room.",
    price: 25.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["noise", "sound", "acoustic"],
    featured: false,
  },
  {
    name: "Vibration Sensor",
    slug: "vibration-sensor",
    description: "Vibration sensors can be used for security purposes, like detecting attempted break-ins or forced entry, or for automation purposes, like sensing when a washing machine has finished its cycle.",
    price: 21.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["vibration", "security", "automation"],
    featured: false,
  },
  {
    name: "Energy Monitoring Sensor",
    slug: "energy-monitoring-sensor",
    description: "Energy monitoring sensors track the power consumption of individual appliances or devices, helping users identify energy hogs and optimize energy usage.",
    price: 39.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["energy", "power", "monitoring"],
    featured: true,
  },
  {
    name: "Gas Leak Sensor",
    slug: "gas-leak-sensor",
    description: "Gas leak sensors detect the presence of flammable or hazardous gases, such as natural gas, propane, or methane.",
    price: 45.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["gas", "leak", "hazardous", "safety"],
    featured: true,
  },
  {
    name: "Occupancy Sensors",
    slug: "occupancy-sensor",
    description: "Occupancy sensors determine if a room or space is occupied by people.",
    price: 34.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["occupancy", "presence", "motion"],
    featured: false,
  },
  {
    name: "Soil Moisture Sensor",
    slug: "soil-moisture-sensor",
    description: "Soil moisture sensors monitor the water content in the soil, helping homeowners optimize irrigation and maintain healthy plants.",
    price: 18.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["soil", "moisture", "water", "irrigation"],
    featured: false,
  },
  {
    name: "UV Sensor",
    slug: "uv-sensor",
    description: "UV sensors measure the intensity of ultraviolet (UV) radiation from the sun.",
    price: 27.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["uv", "ultraviolet", "sun", "radiation"],
    featured: false,
  },
  {
    name: "Presence Sensor",
    slug: "presence-sensor",
    description: "Presence sensors, also known as proximity sensors, detect when a person or object is nearby or within a certain range.",
    price: 32.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["presence", "proximity", "range"],
    featured: true,
  },
  {
    name: "Wind Sensor",
    slug: "wind-sensor",
    description: "Wind sensors, or anemometers, measure wind speed and direction.",
    price: 89.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["wind", "anemometer", "speed", "weather"],
    featured: false,
  },
  {
    name: "Rain Sensor",
    slug: "rain-sensor",
    description: "Rain sensors detect the presence and intensity of rainfall.",
    price: 42.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["rain", "water", "weather"],
    featured: false,
  },
  {
    name: "Garage Door Sensor",
    slug: "garage-door-sensor",
    description: "Garage door sensors monitor the position and status of garage doors, alerting users if the door is left open or if unauthorized access is detected.",
    price: 28.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["garage", "door", "security", "access"],
    featured: false,
  },
  {
    name: "Pressure Sensor",
    slug: "pressure-sensor",
    description: "Pressure sensors measure the force applied to a surface or object, such as the weight of a person on a smart scale or the water pressure in a plumbing system.",
    price: 35.99,
    imageUrl: "/images/sensor.jpg",
    category: Category.SENSOR,
    tags: ["pressure", "force", "weight", "water"],
    featured: false,
  },
  
  // KITS
  {
    name: "Home Security Kit",
    slug: "home-security-kit",
    description: "Comprehensive home security kit including motion, door/window, garage, and presence sensors. Normal price $106.96, save over 15%!",
    price: 89.99,
    imageUrl: "/images/kit.jpg",
    category: Category.KIT,
    tags: ["security", "kit", "home", "safe"],
    featured: true,
  },
  {
    name: "Climate & Environment Kit",
    slug: "climate-environment-kit",
    description: "Monitor your indoor/outdoor environment with temperature, humidity, air quality, light, and UV sensors. Normal price $133.96, save $24!",
    price: 109.99,
    imageUrl: "/images/kit.jpg",
    category: Category.KIT,
    tags: ["climate", "environment", "kit", "weather"],
    featured: true,
  },
  {
    name: "Safety & Hazard Kit",
    slug: "safety-hazard-kit",
    description: "Essential safety devices detecting smoke, carbon monoxide, water leaks, and hazardous gases to protect your home. Normal price $118.97, save $19!",
    price: 99.99,
    imageUrl: "/images/kit.jpg",
    category: Category.KIT,
    tags: ["safety", "hazard", "kit", "emergency"],
    featured: true,
  },
  {
    name: "Smart Agriculture Kit",
    slug: "smart-agriculture-kit",
    description: "Optimize irrigation and monitor weather with soil moisture, wind, rain, and temperature sensors. Perfect for farming. Normal price $181.96, save $32!",
    price: 149.99,
    imageUrl: "/images/kit.jpg",
    category: Category.KIT,
    tags: ["agriculture", "farming", "kit", "weather"],
    featured: true,
  },

  // HUBS
  {
    name: "Core4Hub",
    slug: "core4hub",
    description: "Centrul inteligent al casei tale. Controlează toate dispozitivele IoT dintr-o interfață simplă și intuitivă pe un ecran generos.",
    price: 149.99,
    imageUrl: "/images/core4hub.jpg",
    category: Category.HUB,
    tags: ["hub", "core4hub", "smart home", "control", "centru"],
    featured: true,
  },
  {
    name: "Core4Hub Mini",
    slug: "core4hub-mini",
    description: "Versiunea compactă a hub-ului inteligent. Perfect pentru spații mici, oferind același control complet asupra ecosistemului tău IoT.",
    price: 89.99,
    imageUrl: "/images/core4hub-mini.jpg",
    category: Category.HUB,
    tags: ["hub", "core4hub", "mini", "smart home", "control"],
    featured: false,
  },
  {
    name: "Mobile Health App Extension",
    slug: "mobile-health-app",
    description: "Unlock the Health Module on your SmartHub! Track your macros, calories, step counter, heart rate, and overall fitness goals seamlessly across all your devices.",
    price: 19.99,
    imageUrl: "/images/health-app.jpg",
    category: Category.KIT,
    tags: ["health", "app", "fitness", "macros", "calories", "steps", "heart"],
    featured: true,
  },
];

async function main() {
  console.log("🌱 Clearing old data...");
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.product.deleteMany();

  console.log("🌱 Seeding database...");
  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log(`✅ Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
