#[tauri::command]
fn save_file(path: String, content: Vec<u8>) -> Result<(), String> {
    use std::io::Write;
    let mut file = std::fs::File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(&content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_ai_settings(app: tauri::AppHandle) -> HashMap<String, String> {
    use tauri::Manager;
    if let Ok(dir) = app.path().app_data_dir() {
        let path = dir.join("ai-settings.json");
        if let Ok(text) = std::fs::read_to_string(&path) {
            if let Ok(settings) = serde_json::from_str::<HashMap<String, String>>(&text) {
                return settings;
            }
        }
    }
    HashMap::new()
}

#[tauri::command]
fn save_ai_settings(app: tauri::AppHandle, settings: HashMap<String, String>) -> Result<(), String> {
    use tauri::Manager;
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("ai-settings.json");
    let text = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(&path, text).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn fetch_image(url: String) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    Ok(bytes.to_vec())
}

#[tauri::command]
async fn fetch_audio(url: String) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    Ok(bytes.to_vec())
}

#[tauri::command]
async fn generate_hf_audio(model: String, prompt: String) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!("https://api-inference.huggingface.co/models/{}", model);
    let body = serde_json::json!({ "inputs": prompt });

    let response = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        let text = response.text().await.unwrap_or_default();
        let preview: String = text.chars().take(200).collect();
        return Err(format!("HF error HTTP {}: {}", status, preview));
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    Ok(bytes.to_vec())
}

#[tauri::command]
async fn generate_freetts_tts(text: String, voice: String) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::builder()
        .user_agent("FreeTTS-Integration/1.0")
        .build()
        .map_err(|e| e.to_string())?;

    // Step 1: Generate TTS and get file_id
    let gen_body = serde_json::json!({
        "text": text,
        "voice": voice,
        "rate": "+0%",
        "pitch": "+0Hz"
    });

    let gen_resp = client
        .post("https://freetts.org/api/tts")
        .json(&gen_body)
        .send()
        .await
        .map_err(|e| format!("FreeTTS connection error: {}", e))?;

    if !gen_resp.status().is_success() {
        let status = gen_resp.status().as_u16();
        let body = gen_resp.text().await.unwrap_or_default();
        let preview: String = body.chars().take(200).collect();
        return Err(format!("FreeTTS error HTTP {}: {}", status, preview));
    }

    let gen_json: serde_json::Value = gen_resp
        .json()
        .await
        .map_err(|e| format!("FreeTTS parse error: {}", e))?;

    let file_id = gen_json["file_id"]
        .as_str()
        .ok_or_else(|| "FreeTTS: no file_id in response".to_string())?;

    // Step 2: Download the MP3
    let audio_url = format!("https://freetts.org/api/audio/{}", file_id);
    let audio_resp = client
        .get(&audio_url)
        .send()
        .await
        .map_err(|e| format!("FreeTTS audio download error: {}", e))?;

    if !audio_resp.status().is_success() {
        let status = audio_resp.status().as_u16();
        return Err(format!("FreeTTS audio error HTTP {}", status));
    }

    let bytes = audio_resp.bytes().await.map_err(|e| e.to_string())?;
    Ok(bytes.to_vec())
}

#[tauri::command]
async fn generate_sfx_freesound(prompt: String, api_key: String) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| e.to_string())?;

    let encoded_query = urlencoding(&prompt);
    let encoded_token = urlencoding(&api_key);
    let fields = "fields=id,name,url,previews,score,tags,duration&sort=score&page_size=30";

    // Try progressively more relaxed searches until we get usable results.
    let mut variants: Vec<String> = Vec::new();
    variants.push(format!(
        "https://freesound.org/apiv2/search/text/?query={}&token={}&{}&filter=duration:%5B1.0%20TO%2030.0%5D",
        encoded_query, encoded_token, fields
    ));
    variants.push(format!(
        "https://freesound.org/apiv2/search/text/?query={}&token={}&{}",
        encoded_query, encoded_token, fields
    ));

    // Last-resort: search just the first keyword (relaxed) if the full query fails.
    let first_word = prompt
        .split(|c: char| c.is_whitespace() || c == ',' || c == '.')
        .filter(|w| !w.is_empty())
        .next()
        .map(|w| w.to_string())
        .unwrap_or_else(|| prompt.clone());
    if !first_word.is_empty() && first_word != prompt {
        variants.push(format!(
            "https://freesound.org/apiv2/search/text/?query={}&token={}&{}",
            urlencoding(&first_word), encoded_token, fields
        ));
    }

    let mut search_json: Option<serde_json::Value> = None;
    let mut last_err = String::new();
    for (idx, url) in variants.iter().enumerate() {
        match client.get(url).send().await {
            Ok(resp) if resp.status().is_success() => {
                match resp.json::<serde_json::Value>().await {
                    Ok(json) => {
                        let has_results = json["results"].as_array().map(|a| !a.is_empty()).unwrap_or(false);
                        if has_results {
                            eprintln!("[Freesound] Búsqueda OK (variante {}), query: {}", idx, prompt);
                            search_json = Some(json);
                            break;
                        }
                    }
                    Err(e) => last_err = format!("Freesound parse error: {}", e),
                }
            }
            Ok(resp) => {
                let status = resp.status().as_u16();
                let body = resp.text().await.unwrap_or_default();
                let snippet: String = body.chars().take(150).collect();
                last_err = format!("Freesound search HTTP {}: {}", status, snippet);
            }
            Err(e) => last_err = format!("Freesound search error: {}", e),
        }
    }

    let search_json = search_json.ok_or_else(|| {
        if last_err.is_empty() {
            "Freesound: no se encontraron sonidos para ese prompt".to_string()
        } else {
            last_err
        }
    })?;

    let results = search_json["results"]
        .as_array()
        .ok_or_else(|| "Freesound: no results array in response".to_string())?;

    // sort=score puts the best match first — pick it (no exact name required).
    let first = &results[0];
    let previews = first["previews"]
        .as_object()
        .ok_or_else(|| "Freesound: no previews in result".to_string())?;

    // Try HQ MP3 first, fall back to LQ
    let preview_url = previews
        .get("preview-hq-mp3")
        .or_else(|| previews.get("preview-lq-mp3"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Freesound: no preview URL available".to_string())?;

    eprintln!(
        "[Freesound] Elegido: {} (score: {})",
        first["name"].as_str().unwrap_or("?"),
        first["score"].as_f64().unwrap_or(-1.0)
    );

    // Step 2: Download the preview MP3 (public CDN, no auth needed)
    let audio_resp = client
        .get(preview_url)
        .send()
        .await
        .map_err(|e| format!("Freesound download error: {}", e))?;

    if !audio_resp.status().is_success() {
        let status = audio_resp.status().as_u16();
        return Err(format!("Freesound download HTTP {}", status));
    }

    let bytes = audio_resp.bytes().await.map_err(|e| e.to_string())?;
    let first: Vec<u8> = bytes.iter().take(4).cloned().collect();
    eprintln!(
        "[Freesound] Descargados {} bytes, cabecera: {:02X} {:02X} {:02X} {:02X}, de {}",
        bytes.len(),
        first.get(0).copied().unwrap_or(0),
        first.get(1).copied().unwrap_or(0),
        first.get(2).copied().unwrap_or(0),
        first.get(3).copied().unwrap_or(0),
        preview_url
    );
    Ok(bytes.to_vec())
}

fn urlencoding(s: &str) -> String {
    // Simple URL encoding using percent-encoding
    let mut result = String::new();
    for byte in s.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                result.push(byte as char);
            }
            b' ' => result.push_str("%20"),
            _ => {
                result.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    result
}

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex as StdMutex, OnceLock};

static SHARED_HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

fn get_shared_client() -> &'static reqwest::Client {
    SHARED_HTTP_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .user_agent("Scratch-AI/1.0")
            .tcp_nodelay(true)
            .pool_max_idle_per_host(10)
            .pool_idle_timeout(std::time::Duration::from_secs(90))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new())
    })
}

#[tauri::command]
async fn zen_chat(api_key: String, body: String) -> Result<serde_json::Value, String> {
    let client = get_shared_client();
    let response = client
        .post("https://opencode.ai/zen/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = response.status().as_u16();
    let text = response.text().await.map_err(|e| e.to_string())?;
    if status != 200 {
        let preview: String = text.chars().take(300).collect();
        return Err(format!("Zen HTTP {}: {}", status, preview));
    }
    serde_json::from_str(&text).map_err(|e| format!("Zen parse error: {}", e))
}

#[tauri::command]
async fn zen_models(api_key: String) -> Result<serde_json::Value, String> {
    let client = get_shared_client();
    let response = client
        .get("https://opencode.ai/zen/v1/models")
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = response.status().as_u16();
    let text = response.text().await.map_err(|e| e.to_string())?;
    if status != 200 {
        let preview: String = text.chars().take(300).collect();
        return Err(format!("Zen HTTP {}: {}", status, preview));
    }
    serde_json::from_str(&text).map_err(|e| format!("Zen parse error: {}", e))
}

static ZEN_CANCEL_FLAGS: OnceLock<StdMutex<HashMap<String, Arc<AtomicBool>>>> = OnceLock::new();

fn zen_cancel_flags() -> &'static StdMutex<HashMap<String, Arc<AtomicBool>>> {
    ZEN_CANCEL_FLAGS.get_or_init(|| StdMutex::new(HashMap::new()))
}

// ── Shared streaming core ──
// zen/ai/gemini chats share the same SSE-cancellable pipeline. The only real
// differences are: event name, URL, auth mode, response-text extraction, and a
// couple of Gemini-specific quirks (trailing flush, no error-field object, empty is OK).
type StreamExtract = fn(&serde_json::Value) -> Option<String>;

fn openai_flat_text(v: &serde_json::Value) -> Option<String> {
    v["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
}

fn openai_delta_text(v: &serde_json::Value) -> Option<String> {
    v["choices"][0]["delta"]["content"]
        .as_str()
        .map(|s| s.to_string())
}

#[derive(Clone, Copy, PartialEq)]
enum ZenAuthMode {
    AlwaysBearer,
    BearerIfKey,
    NoAuth,
}

struct StreamSpec {
    event: &'static str,
    label: &'static str,
    url: String,
    api_key: String,
    body: String,
    request_id: String,
    flags: &'static StdMutex<HashMap<String, Arc<AtomicBool>>>,
    auth: ZenAuthMode,
    flat_extract: StreamExtract,
    delta_extract: StreamExtract,
    check_error_field: bool,
    empty_is_ok: bool,
    trailing_flush: bool,
    show_raw_preview: bool,
}

async fn stream_chat_impl(app: tauri::AppHandle, spec: StreamSpec) -> Result<(), String> {
    use tauri::Emitter;
    use futures_util::StreamExt;

    let cancel = Arc::new(AtomicBool::new(false));
    {
        let mut flags = spec.flags.lock().unwrap();
        flags.insert(spec.request_id.clone(), cancel.clone());
    }

    let emit_error = |msg: String| {
        let _ = app.emit(spec.event, serde_json::json!({
            "requestId": spec.request_id.clone(),
            "error": msg.clone()
        }));
    };

    let finish = || {
        let mut flags = spec.flags.lock().unwrap();
        flags.remove(&spec.request_id);
    };

    let client = get_shared_client();

    let mut req = client
        .post(&spec.url)
        .header("Content-Type", "application/json")
        .header("Accept", "text/event-stream");
    match spec.auth {
        ZenAuthMode::AlwaysBearer => {
            req = req.header("Authorization", format!("Bearer {}", spec.api_key));
        }
        ZenAuthMode::BearerIfKey => {
            if !spec.api_key.is_empty() {
                req = req.header("Authorization", format!("Bearer {}", spec.api_key));
            }
        }
        ZenAuthMode::NoAuth => {}
    }

    let response = match req.body(spec.body.clone()).send().await {
        Ok(r) => r,
        Err(e) => {
            let msg = format!("{} conexión: {}", spec.label, e);
            emit_error(msg.clone());
            finish();
            return Err(msg);
        }
    };

    let status = response.status().as_u16();
    if status != 200 {
        let text = response.text().await.unwrap_or_default();
        let preview: String = text.chars().take(300).collect();
        let msg = format!("{} HTTP {}: {}", spec.label, status, preview);
        emit_error(msg.clone());
        finish();
        return Err(msg);
    }

    let is_sse = response
        .headers()
        .get("content-type")
        .map(|v| v.to_str().map(|s| s.contains("text/event-stream")).unwrap_or(false))
        .unwrap_or(false);

    if !is_sse {
        let text = response.text().await.map_err(|e| {
            let msg = format!("{} lectura de respuesta: {}", spec.label, e);
            emit_error(msg.clone());
            msg
        })?;
        match serde_json::from_str::<serde_json::Value>(&text) {
            Ok(v) => {
                if let Some(content) = (spec.flat_extract)(&v) {
                    if !content.is_empty() {
                        let _ = app.emit(spec.event, serde_json::json!({
                            "requestId": spec.request_id.clone(), "delta": content
                        }));
                    }
                    let _ = app.emit(spec.event, serde_json::json!({
                        "requestId": spec.request_id, "done": true
                    }));
                    finish();
                    return Ok(());
                }
                if spec.check_error_field {
                    if let Some(err_obj) = v["error"].as_object() {
                        let msg = err_obj.get("message")
                            .and_then(|m| m.as_str())
                            .unwrap_or("error de API")
                            .to_string();
                        emit_error(msg.clone());
                        finish();
                        return Err(msg);
                    }
                }
                if spec.empty_is_ok {
                    let _ = app.emit(spec.event, serde_json::json!({
                        "requestId": spec.request_id, "done": true
                    }));
                    finish();
                    return Ok(());
                }
                let preview: String = text.chars().take(300).collect();
                let msg = format!("La API devolvió una respuesta vacía o inesperada. Respuesta: {}", preview);
                emit_error(msg.clone());
                finish();
                return Err(msg);
            }
            Err(_) => {
                let preview: String = text.chars().take(300).collect();
                let msg = format!("Respuesta no parseable como JSON. Respuesta: {}", preview);
                emit_error(msg.clone());
                finish();
                return Err(msg);
            }
        }
    }

    let mut stream = response.bytes_stream();
    let mut buf = String::new();
    let mut result: Result<(), String> = Ok(());
    let mut raw_preview = String::new();
    let mut delta_count = 0usize;

    while let Some(chunk) = stream.next().await {
        if cancel.load(Ordering::SeqCst) {
            let _ = app.emit(spec.event, serde_json::json!({
                "requestId": spec.request_id, "done": true, "cancelled": true
            }));
            finish();
            return Ok(());
        }
        let chunk = match chunk {
            Ok(c) => c,
            Err(e) => {
                let msg = format!("{} stream: {}", spec.label, e);
                emit_error(msg.clone());
                result = Err(msg.clone());
                break;
            }
        };
        let text_chunk = String::from_utf8_lossy(&chunk);
        if raw_preview.len() < 500 {
            raw_preview.push_str(&text_chunk);
        }
        buf.push_str(&text_chunk);
        while let Some(nl) = buf.find('\n') {
            let line: String = buf[..nl].trim_end_matches('\r').to_string();
            buf = buf[nl + 1..].to_string();
            let data = line.strip_prefix("data:").map(|d| d.trim().to_string());
            if let Some(data) = data {
                if data == "[DONE]" {
                    let _ = app.emit(spec.event, serde_json::json!({
                        "requestId": spec.request_id, "done": true
                    }));
                    finish();
                    return Ok(());
                }
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(&data) {
                    if let Some(content) = (spec.delta_extract)(&v) {
                        if !content.is_empty() {
                            delta_count += 1;
                            let _ = app.emit(spec.event, serde_json::json!({
                                "requestId": spec.request_id, "delta": content
                            }));
                        }
                    } else if spec.check_error_field {
                        if let Some(err_obj) = v["error"].as_object() {
                            let msg = err_obj.get("message")
                                .and_then(|m| m.as_str())
                                .unwrap_or("error de streaming")
                                .to_string();
                            emit_error(msg.clone());
                            result = Err(msg.clone());
                            break;
                        }
                    }
                }
            }
        }
    }

    if spec.trailing_flush && !buf.trim().is_empty() {
        let line = buf.trim().trim_start_matches("data:").trim().to_string();
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&line) {
            if let Some(content) = (spec.delta_extract)(&v) {
                if !content.is_empty() {
                    delta_count += 1;
                    let _ = app.emit(spec.event, serde_json::json!({
                        "requestId": spec.request_id, "delta": content
                    }));
                }
            }
        }
    }

    if let Err(msg) = result {
        finish();
        return Err(msg);
    }

    if delta_count == 0 {
        let msg = if spec.show_raw_preview && !raw_preview.trim().is_empty() {
            format!("El proveedor devolvió una transmisión sin contenido utilizable. Respuesta cruda: {}", raw_preview)
        } else {
            "El proveedor devolvió una transmisión vacía.".to_string()
        };
        emit_error(msg.clone());
        finish();
        return Err(msg);
    }

    let _ = app.emit(spec.event, serde_json::json!({
        "requestId": spec.request_id, "done": true
    }));
    finish();
    Ok(())
}

#[tauri::command]
async fn zen_chat_stream(app: tauri::AppHandle, request_id: String, api_key: String, body: String) -> Result<(), String> {
    stream_chat_impl(app, StreamSpec {
        event: "zen-chunk",
        label: "Zen",
        url: "https://opencode.ai/zen/v1/chat/completions".to_string(),
        api_key,
        body,
        request_id,
        flags: zen_cancel_flags(),
        auth: ZenAuthMode::AlwaysBearer,
        flat_extract: openai_flat_text,
        delta_extract: openai_delta_text,
        check_error_field: true,
        empty_is_ok: false,
        trailing_flush: false,
        show_raw_preview: true,
    }).await
}

#[tauri::command]
fn zen_chat_cancel(request_id: String) {
    if let Some(flag) = zen_cancel_flags().lock().unwrap().get(&request_id) {
        flag.store(true, Ordering::SeqCst);
    }
}

#[tauri::command]
async fn fetch_provider_models(url: String, api_key: String) -> Result<serde_json::Value, String> {
    let client = get_shared_client();
    let mut req = client.get(&url);
    if !api_key.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", api_key));
    }
    let response = req.send().await.map_err(|e| e.to_string())?;
    let status = response.status().as_u16();
    let text = response.text().await.map_err(|e| e.to_string())?;
    if status != 200 {
        let preview: String = text.chars().take(300).collect();
        return Err(format!("HTTP {}: {}", status, preview));
    }
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

#[tauri::command]
async fn ai_chat(url: String, api_key: String, body: String) -> Result<serde_json::Value, String> {
    let client = get_shared_client();
    let mut req = client.post(&url).header("Content-Type", "application/json");
    if !api_key.is_empty() {
        req = req.header("Authorization", format!("Bearer {}", api_key));
    }
    let response = req.body(body).send().await.map_err(|e| e.to_string())?;
    let status = response.status().as_u16();
    let text = response.text().await.map_err(|e| e.to_string())?;
    if status != 200 {
        let preview: String = text.chars().take(300).collect();
        return Err(format!("HTTP {}: {}", status, preview));
    }
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

static AI_CANCEL_FLAGS: OnceLock<StdMutex<HashMap<String, Arc<AtomicBool>>>> = OnceLock::new();

fn ai_cancel_flags() -> &'static StdMutex<HashMap<String, Arc<AtomicBool>>> {
    AI_CANCEL_FLAGS.get_or_init(|| StdMutex::new(HashMap::new()))
}

#[tauri::command]
async fn ai_chat_stream(app: tauri::AppHandle, request_id: String, url: String, api_key: String, body: String) -> Result<(), String> {
    stream_chat_impl(app, StreamSpec {
        event: "ai-chunk",
        label: "AI",
        url,
        api_key,
        body,
        request_id,
        flags: ai_cancel_flags(),
        auth: ZenAuthMode::BearerIfKey,
        flat_extract: openai_flat_text,
        delta_extract: openai_delta_text,
        check_error_field: true,
        empty_is_ok: false,
        trailing_flush: false,
        show_raw_preview: true,
    }).await
}

#[tauri::command]
fn ai_chat_cancel(request_id: String) {
    if let Some(flag) = ai_cancel_flags().lock().unwrap().get(&request_id) {
        flag.store(true, Ordering::SeqCst);
    }
}

fn extract_gemini_text(v: &serde_json::Value) -> Option<String> {
    let parts = v.get("candidates")?.get(0)?.get("content")?.get("parts")?.as_array()?;
    let mut text = String::new();
    for p in parts {
        if let Some(t) = p.get("text").and_then(|t| t.as_str()) {
            text.push_str(t);
        }
    }
    if text.is_empty() { None } else { Some(text) }
}

#[tauri::command]
async fn gemini_chat(url: String, body: String) -> Result<serde_json::Value, String> {
    let client = get_shared_client();
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = response.status().as_u16();
    let text = response.text().await.map_err(|e| e.to_string())?;
    if status != 200 {
        let preview: String = text.chars().take(300).collect();
        return Err(format!("HTTP {}: {}", status, preview));
    }
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

#[tauri::command]
async fn gemini_chat_stream(app: tauri::AppHandle, request_id: String, url: String, body: String) -> Result<(), String> {
    stream_chat_impl(app, StreamSpec {
        event: "gemini-chunk",
        label: "Gemini",
        url,
        api_key: String::new(),
        body,
        request_id,
        flags: ai_cancel_flags(),
        auth: ZenAuthMode::NoAuth,
        flat_extract: extract_gemini_text,
        delta_extract: extract_gemini_text,
        check_error_field: false,
        empty_is_ok: true,
        trailing_flush: true,
        show_raw_preview: false,
    }).await
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
    save_file, fetch_image, fetch_audio, generate_hf_audio,
    generate_freetts_tts, generate_sfx_freesound, open_url,
    zen_chat, zen_models, zen_chat_stream, zen_chat_cancel,
    load_ai_settings, save_ai_settings,
    fetch_provider_models, ai_chat, ai_chat_stream, ai_chat_cancel,
    gemini_chat, gemini_chat_stream
])
    .setup(|app| {
      use tauri::Manager;
      if let Some(window) = app.get_webview_window("main") {
        let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/128x128@2x.png"))?;
        window.set_icon(icon)?;
      }
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
