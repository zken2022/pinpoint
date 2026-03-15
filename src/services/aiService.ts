import { AppSettings, GeoAnalysisResult, ExifData } from "../types";
import { robustParseGeoJSON } from "../utils/jsonUtils";

export async function analyzeWithOpenAICompatible(
  imageData: string,
  settings: AppSettings,
  onStream: (chunk: string, type: 'thinking' | 'content') => void,
  exif?: ExifData
): Promise<GeoAnalysisResult> {
  const { provider, model, apiKey, baseUrl } = settings;
  
  if (provider === 'siliconflow' && !apiKey) throw new Error(`${provider} 需要 API 密钥`);

  const url = baseUrl || (provider === 'siliconflow' ? 'https://api.siliconflow.cn/v1' : 'http://localhost:11434/v1');

  const exifText = exif ? `\n\n图像 EXIF 数据：\n${JSON.stringify(exif, null, 2)}` : "\n\n未检测到图像 EXIF 数据。";

  const response = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey || 'ollama'}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: `你是一位专业的 OSINT 专家。你的任务是分析提供的图像以及图像的 EXIF 元数据，并确定其精确的地理位置。
          
          **工作流程要求：**
          1. **线索对比**：请对比图像中的视觉线索与提供的 EXIF 元数据。
             - 如果 EXIF 包含 GPS 坐标，请验证图像中的环境（植被、建筑、气候）是否与该坐标位置相符。
             - 如果视觉线索与 EXIF 数据存在冲突，请指出这种不一致性，并分析可能的伪造或错误原因。
          2. **推理依据**：详细描述你的推理依据（分析建筑、植被、基础设施、语言、环境线索等）。
          3. **逻辑推演**：进行逻辑推演，缩小范围。
          4. **结构化输出**：最后提供一个包含以下键的 JSON 对象：location (address, coordinates: {lat, lng}), confidence, reasoning, features (architecture, vegetation, infrastructure, climate, language)。
          
          请务必使用中文。请确保 JSON 格式正确，且作为响应的最后一部分输出。`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `请详细分析这张图片的地理位置。${exifText}\n\n首先展示你的推理依据，最后提供 JSON 结果。` },
            { type: 'image_url', image_url: { url: imageData } }
          ]
        }
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI 请求失败: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  let fullText = "";
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        try {
          const json = JSON.parse(data);
          const delta = json.choices[0]?.delta;
          const content = delta?.content || "";
          const reasoning = delta?.reasoning_content || "";
          
          if (reasoning) {
            onStream(reasoning, 'thinking');
          }
          
          if (content) {
            fullText += content;
            onStream(content, 'content');
          }
        } catch (e) {
          // Ignore parse errors for partial chunks
        }
      }
    }
  }

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return robustParseGeoJSON(jsonMatch[0]);
    } catch (e) {
      console.error("Robust parse failed", e);
    }
  }

  console.error("AI Response that failed parsing:", fullText);
  throw new Error("无法从 AI 响应中提取结构化数据。请尝试重新运行或更换模型。");
}
