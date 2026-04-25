/**
 * SmartHub Sensor Node — Arduino Uno R4 WiFi
 * Senzori: AHT20 (temp), BMP280 (presiune), HC-SR602 (miscare), TEMT6000 (lumina)
 * 
 * LIBRARII NECESARE (Manage Libraries):
 *   - Adafruit BMP280 Library
 *   - Adafruit AHTX0
 *   - Adafruit Unified Sensor (dependinta)
 *   - ArduinoJson (v6 by Benoit Blanchon)
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_AHTX0.h>
#include <WiFiS3.h>
#include <ArduinoJson.h>  // ← NOU: installeaza din Manage Libraries

// ═══════════════════════════════════════════════════════════
//  EDITEAZĂ ACESTE 4 LINII
// ═══════════════════════════════════════════════════════════
const char *ssid         = "NUMELE_RETELEI_TALE";          // WiFi SSID
const char *password     = "PAROLA_RETELEI_TALE";          // WiFi Password
const char *HUB_HOST     = "192.168.X.X";                  // IP-ul PC-ului tau (vezi instructiuni)
const char *DEVICE_TOKEN = "smarthub-arduino-secret-2026"; // NU modifica
// ═══════════════════════════════════════════════════════════

const int   HUB_PORT  = 3000;
const char *DEVICE_ID = "arduino-1";

int status = WL_IDLE_STATUS;
WiFiServer server(80);
WiFiClient client;

// --- Definire Pini ---
#define PIR_PIN   8    // HC-SR602 OUT → Pin 8
#define LIGHT_PIN A0   // TEMT6000 SIG → A0

// Senzori
Adafruit_BMP280 bmp;
Adafruit_AHTX0  aht;

// --- Intervale ---
const unsigned long INTERVAL_COMBO = 2000;
const unsigned long INTERVAL_PIR   = 500;
const unsigned long INTERVAL_LIGHT = 1000;
const unsigned long INTERVAL_SEND  = 5000;   // trimitere la hub la fiecare 5s

unsigned long lastTimeCombo = 0;
unsigned long lastTimePIR   = 0;
unsigned long lastTimeLight = 0;
unsigned long lastTimeSend  = 0;

// Valori curente senzori
float  webTemp   = 0.0;
float  webPress  = 0.0;
bool   webMotion = false;
int    webLight  = 0;

// ─────────────────────────────────────────────────────────
void connectToWiFi()
{
    if (WiFi.status() == WL_NO_MODULE) {
        Serial.println("Modul WiFi lipsa!");
        while (true);
    }

    Serial.print("Conectare la: ");
    Serial.println(ssid);

    while (status != WL_CONNECTED) {
        status = WiFi.begin(ssid, password);
        if (status != WL_CONNECTED) {
            Serial.println("Esuat. Reincercare in 5s...");
            delay(5000);
        }
    }

    Serial.println("========================================");
    Serial.println("WiFi conectat cu succes!");
    Serial.print("IP Arduino: ");
    Serial.println(WiFi.localIP());
    Serial.print("Trimite date la: http://");
    Serial.print(HUB_HOST);
    Serial.println(":3000");
    Serial.println("========================================");
}

// ─────────────────────────────────────────────────────────
void sendToHub()
{
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[Hub] WiFi deconectat, skip.");
        return;
    }

    // Construieste payload JSON
    StaticJsonDocument<256> doc;
    doc["device_id"]       = DEVICE_ID;
    doc["temperature"]     = round(webTemp  * 10.0) / 10.0;
    doc["pressure"]        = round(webPress * 10.0) / 10.0;
    doc["light_level"]     = webLight;
    doc["motion_detected"] = webMotion;

    String body;
    serializeJson(doc, body);

    Serial.print("[Hub] Trimitere: ");
    Serial.println(body);

    if (!client.connect(HUB_HOST, HUB_PORT)) {
        Serial.println("[Hub] EROARE: Nu pot conecta la backend!");
        return;
    }

    // HTTP POST
    client.println("POST /api/arduino/data HTTP/1.1");
    client.print("Host: "); client.println(HUB_HOST);
    client.println("Content-Type: application/json");
    client.print("x-device-token: "); client.println(DEVICE_TOKEN);
    client.println("Connection: close");
    client.print("Content-Length: "); client.println(body.length());
    client.println();
    client.println(body);

    // Asteapta raspuns max 5s
    unsigned long timeout = millis();
    while (client.available() == 0) {
        if (millis() - timeout > 5000) {
            Serial.println("[Hub] Timeout raspuns.");
            client.stop();
            return;
        }
    }

    String resp = client.readStringUntil('\n');
    Serial.print("[Hub] Raspuns: "); Serial.println(resp);
    client.stop();
}

// ─────────────────────────────────────────────────────────
void setup()
{
    Serial.begin(115200);
    while (!Serial) delay(10);

    Serial.println("=== SmartHub Sensor Node ===");

    connectToWiFi();
    server.begin();

    Serial.println("Initializare senzori...");

    pinMode(PIR_PIN,   INPUT);
    pinMode(LIGHT_PIN, INPUT);

    if (!aht.begin())
        Serial.println("EROARE: AHT20 negasit!");
    else
        Serial.println("AHT20 OK.");

    if (!bmp.begin(0x77) && !bmp.begin(0x76))
        Serial.println("EROARE: BMP280 negasit!");
    else {
        bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                        Adafruit_BMP280::SAMPLING_X2,
                        Adafruit_BMP280::SAMPLING_X16,
                        Adafruit_BMP280::FILTER_X16,
                        Adafruit_BMP280::STANDBY_MS_500);
        Serial.println("BMP280 OK.");
    }

    Serial.println("Gata! Date trimise la hub la fiecare 5 secunde.");
}

// ─────────────────────────────────────────────────────────
void loop()
{
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi pierdut, reconectare...");
        status = WL_IDLE_STATUS;
        connectToWiFi();
    }

    unsigned long now = millis();

    // AHT20 (temp) + BMP280 (presiune)
    if (now - lastTimeCombo >= INTERVAL_COMBO) {
        lastTimeCombo = now;
        sensors_event_t humidity, temp;
        aht.getEvent(&humidity, &temp);

        webTemp  = temp.temperature;
        webPress = bmp.readPressure() / 100.0F;

        Serial.printf("[Senzori] Temp: %.1fC | Presiune: %.1f hPa\n", webTemp, webPress);
    }

    // PIR
    if (now - lastTimePIR >= INTERVAL_PIR) {
        lastTimePIR = now;
        webMotion = (digitalRead(PIR_PIN) == HIGH);
        if (webMotion) Serial.println("[PIR] Miscare detectata!");
    }

    // Lumina
    if (now - lastTimeLight >= INTERVAL_LIGHT) {
        lastTimeLight = now;
        webLight = analogRead(LIGHT_PIN);
    }

    // Trimitere la SmartHub
    if (now - lastTimeSend >= INTERVAL_SEND) {
        lastTimeSend = now;
        sendToHub();
    }
}
