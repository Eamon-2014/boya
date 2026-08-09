// src/lib/ai/bailian.ts - 阿里云百炼智能体应用调用封装
// 文档：https://help.aliyun.com/zh/model-studio/call-single-agent-application/

const API_KEY = process.env.DASHSCOPE_API_KEY || '';
const APP_ID = process.env.DASHSCOPE_APP_ID || '';
const BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1';

/**
 * 调用百炼智能体应用，返回模型输出的文本。
 *
 * @param prompt  用户提示词（System Prompt 已在百炼控制台应用内配置）
 * @param options 可选参数
 * @returns 模型输出文本（output.text）
 */
export async function callBailianAgent(
  prompt: string,
  options: { timeoutMs?: number } = {},
): Promise<string> {
  const { timeoutMs = 120_000 } = options;

  if (!API_KEY) throw new Error('DASHSCOPE_API_KEY 未配置');
  if (!APP_ID) throw new Error('DASHSCOPE_APP_ID 未配置');

  const url = `${BASE_URL}/apps/${APP_ID}/completion`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        input: { prompt },
        parameters: {},
        debug: {},
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`百炼 HTTP ${res.status}: ${text.slice(0, 500)}`);
    }

    const data = await res.json();
    const text: string | undefined = data?.output?.text;
    if (!text) {
      throw new Error('百炼返回内容为空：' + JSON.stringify(data).slice(0, 300));
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 容错 JSON 解析：模型偶尔会用 ```json ... ``` 包裹输出
 */
export function safeJsonParse(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const raw = fenced ? fenced[1] : trimmed;

  try {
    return JSON.parse(raw);
  } catch {
    // 尝试截取第一个 { 到最后一个 }
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(raw.slice(first, last + 1));
      } catch {
        /* noop */
      }
    }
    throw new Error('JSON 解析失败，模型输出（前 200 字）：' + raw.slice(0, 200));
  }
}
