import { GeoAnalysisResult } from "../types";

/**
 * Attempts to repair and parse malformed JSON from AI responses.
 * Handles common issues like missing quotes, trailing commas, and non-numeric confidence.
 */
export function robustParseGeoJSON(jsonStr: string): GeoAnalysisResult {
  // 1. Basic cleanup
  let cleaned = jsonStr.trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  
  // Find the first { and last }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }

  // 2. Try standard parse
  try {
    const parsed = JSON.parse(cleaned);
    return normalizeResult(parsed);
  } catch (e) {
    // 3. Heuristic repair
    let repaired = cleaned;
    
    // Fix missing opening quotes for keys: lat": -> "lat":
    repaired = repaired.replace(/([{,\s])([a-zA-Z0-9_]+)":/g, '$1"$2":');
    
    // Fix missing quotes entirely for keys: lat: -> "lat":
    repaired = repaired.replace(/([{,\s])([a-zA-Z0-9_]+):/g, '$1"$2":');
    
    // Fix missing closing quotes for keys: "lat: -> "lat":
    repaired = repaired.replace(/"([a-zA-Z0-9_]+):/g, '"$1":');
    
    // Fix missing colon before object: "features" { -> "features": {
    repaired = repaired.replace(/"([a-zA-Z0-9_]+)"\s*\{/g, '"$1": {');
    
    // Fix trailing commas
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    try {
      const parsed = JSON.parse(repaired);
      return normalizeResult(parsed);
    } catch (innerE) {
      // 4. Final fallback: Regex extraction for critical fields
      return regexExtract(cleaned);
    }
  }
}

function normalizeResult(obj: any): GeoAnalysisResult {
  const lat = parseFloat(obj.location?.coordinates?.lat);
  const lng = parseFloat(obj.location?.coordinates?.lng);

  const result: GeoAnalysisResult = {
    location: {
      address: obj.location?.address || "未知地点",
      coordinates: {
        lat: isNaN(lat) ? 0 : lat,
        lng: isNaN(lng) ? 0 : lng
      }
    },
    confidence: parseConfidence(obj.confidence),
    reasoning: obj.reasoning || "",
    features: {
      architecture: obj.features?.architecture || "",
      vegetation: obj.features?.vegetation || "",
      infrastructure: obj.features?.infrastructure || "",
      climate: obj.features?.climate || "",
      language: obj.features?.language || ""
    }
  };
  return result;
}

function parseConfidence(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0.5 : val;
  if (typeof val === 'string') {
    // Try to extract a number from string like "0.9" or "90%"
    const match = val.match(/[\d.]+/);
    if (match) {
      const num = parseFloat(match[0]);
      if (!isNaN(num)) return num > 1 ? num / 100 : num;
    }
    
    // Handle Chinese labels
    if (val.includes('高')) return 0.9;
    if (val.includes('中')) return 0.6;
    if (val.includes('低')) return 0.3;
  }
  return 0.5;
}

function regexExtract(text: string): GeoAnalysisResult {
  const extract = (key: string) => {
    // Matches "key": "value" or key": "value" or "key" { "subkey": "value"
    const regex = new RegExp(`"?${key}"?\\s*[:{]?\\s*"([^"]+)"`, 'i');
    const match = text.match(regex);
    return match ? match[1] : "";
  };

  // More flexible coordinate extraction
  const latMatch = text.match(/"?(?:lat|latitude)"?\s*[:\s]*([\d.-]+)/i);
  const lngMatch = text.match(/"?(?:lng|longitude)"?\s*[:\s]*([\d.-]+)/i);

  const lat = latMatch ? parseFloat(latMatch[1]) : 0;
  const lng = lngMatch ? parseFloat(lngMatch[1]) : 0;

  return {
    location: {
      address: extract("address") || "解析失败，请查看推理依据",
      coordinates: {
        lat: isNaN(lat) ? 0 : lat,
        lng: isNaN(lng) ? 0 : lng
      }
    },
    confidence: parseConfidence(extract("confidence")),
    reasoning: extract("reasoning"),
    features: {
      architecture: extract("architecture"),
      vegetation: extract("vegetation"),
      infrastructure: extract("infrastructure"),
      climate: extract("climate"),
      language: extract("language")
    }
  };
}
