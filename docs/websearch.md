---
summary: "Tavily, SearXNG, Grok을 위한 웹 검색 설정"
read_when:
  - Tavily 또는 Grok을 웹 검색에 사용하고 싶을 때
  - 자체 호스팅 SearXNG 인스턴스를 설정하고 싶을 때
title: "웹 검색 프로바이더"
---

# 웹 검색 프로바이더 (Web search providers)

OpenClaw는 `web_search` 도구를 통해 여러 웹 검색 프로바이더를 지원합니다. `~/.openclaw/openclaw.json` 파일 또는 환경 변수를 통해 설정할 수 있습니다.

## Tavily

[Tavily](https://tavily.com/)는 AI 에이전트 최적화 검색 엔진입니다.

1. **환경 변수:** 환경 변수에 `TAVILY_API_KEY`를 설정하세요.
2. **설정:** `~/.openclaw/openclaw.json`을 업데이트하세요:

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "tavily",
        "tavily": {
          "apiKey": "your-tavily-api-key"
        }
      }
    }
  }
}
```

### 최신성 지원

Tavily는 `freshness` 파라미터(`pd`, `pw`, `pm`, `py`)를 지원하며, 이는 각각 Tavily의 `days` 파라미터(1일, 7일, 30일, 365일)로 매핑되어 최신 콘텐츠를 필터링합니다.

## SearXNG (자체 호스팅)

[SearXNG](https://github.com/searxng/searxng)는 직접 호스팅할 수 있는 무료이며 개인정보를 보호하는 메타 검색 엔진입니다. 로컬 또는 비공개 검색 워크플로우를 위해 권장되는 선택입니다.

### 1. 설치

SearXNG를 실행하는 가장 쉬운 방법은 Docker를 사용하는 것입니다.

#### 기본 실행

```bash
docker run -d -p 8080:8080 --name searxng searxng/searxng
```

#### 권장 실행 (데이터 유지)

SearXNG 설정을 커스터마이징하려면 설정 파일을 위한 로컬 폴더를 마운트하세요:

```bash
mkdir -p ./searxng
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/searxng:/etc/searxng \
  --name searxng \
  searxng/searxng
```

### 2. SearXNG 설정 (`settings.yml`)

OpenClaw는 SearXNG가 JSON 출력을 지원해야 합니다. `settings.yml`(컨테이너 내부의 `/etc/searxng`에 위치)에서 이를 활성화해야 합니다.

```yaml
# settings.yml
use_default_settings: true

server:
  port: 8080
  bind_address: "0.0.0.0"
  secret_key: "random_string으로_변경하세요"

search:
  formats:
    - html
    - json # 중요: OpenClaw를 위해 반드시 활성화해야 함
```

### 3. OpenClaw 설정

`~/.openclaw/openclaw.json`을 업데이트하여 인스턴스를 가리키도록 하세요.

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "searxng",
        "allowPrivateNetwork": true,
        "searxng": {
          "baseUrl": "http://10.251.1.32:8080"
        }
      }
    }
  }
}
```

- **`baseUrl`**: SearXNG 서버의 IP 주소 또는 호스트네임을 사용하세요. OpenClaw와 같은 머신에서 실행 중이라면 `http://localhost:8080`을 사용할 수 있습니다.
- **`allowPrivateNetwork`**: SearXNG 인스턴스가 로컬/사설 IP(`10.x.x.x` 또는 `192.168.x.x`) 또는 `localhost`에 있는 경우 이를 `true`로 설정하세요.

### 4. 문제 해결

#### 403 Forbidden 오류

403 Forbidden 오류가 발생하는 경우(예: Mattermost에서 날씨를 물어볼 때), 보통 SearXNG의 봇 감지 기능이나 JSON 형식이 누락되어 요청이 차단되었음을 의미합니다.

**잠재적 원인:**

- `settings.yml`에 `json` 형식이 누락됨.
- 서버 측 제한 (속도 제한, `Limiter` 플러그인을 통한 IP 차단).
- SearXNG 인스턴스 설정 오류.

##### 해결 방법 1: 실행 중인 컨테이너 내부에서 수정

1.  **컨테이너 확인:**
    ```bash
    docker ps | grep searxng
    ```
2.  **컨테이너 진입:**
    ```bash
    docker exec -it {container_name} sh
    ```
3.  **`settings.yml` 위치 확인 및 수정:**

    ```bash
    find / -name "settings.yml" 2>/dev/null
    vi /etc/searxng/settings.yml
    ```

    `formats`에 `json`을 추가하고, 사설 네트워크에 있는 경우 `Limiter`를 주석 처리하세요:

    ```yaml
    search:
      formats:
        - html
        - json # ← 추가

    enabled_plugins:
      # - 'Limiter' # ← 개인/사설 인스턴스의 경우 주석 처리
      - "Basic Calculator"
      - "Hash plugin"
    ```

    > [!WARNING]
    > 공개 인스턴스의 경우 `Limiter`를 활성화된 상태로 유지하세요. 내부 또는 사설 네트워크 사용 시에만 비활성화하세요.

4.  **컨테이너 재시작:**
    ```bash
    exit
    docker restart {container_name}
    ```

##### 해결 방법 2: 볼륨 마운트 (권장)

컨테이너 업데이트 또는 삭제 후에도 설정이 유지되도록 호스트 측의 `settings.yml`을 마운트하세요.

1.  **컨테이너에서 설정 복사:**
    ```bash
    docker cp {container_id}:/etc/searxng/settings.yml ~/searxng-settings.yml
    ```
2.  **호스트에서 파일 수정:**
    방법 1에서 설명한 대로 `formats`에 `json`을 추가하고 `Limiter`를 비활성화하세요.
3.  **볼륨 마운트와 함께 재시작:**
    ```bash
    docker stop searxng
    docker rm searxng
    docker run -d \
      --name searxng \
      -p 8080:8080 \
      -v ~/searxng-settings.yml:/etc/searxng/settings.yml \
      searxng/searxng
    ```

##### 수정 확인 (curl)

JSON 엔드포인트가 수동으로 작동하는지 확인하세요:

```bash
curl -X GET "http://localhost:8080/search?q=test&format=json" \
  -H "User-Agent: Mozilla/5.0" \
  -H "Accept-Language: ko-KR,ko;q=0.9"
```

JSON 응답이 오면 구성이 올바른 것입니다. 여전히 403이 나타나면 `settings.yml`을 다시 확인하세요.

#### 최신성 및 언어 지원

SearXNG는 다음을 지원합니다:

- **`freshness`**: 값(`pd`, `pw`, `pm`, `py`)이 SearXNG의 `time_range` 필터(`day`, `week`, `month`, `year`)로 매핑됩니다.
- **`language`**: 결과 언어를 필터링하기 위한 ISO 639-1 언어 코드(예: `ko`, `en`, `de`)입니다.

## Perplexity / OpenRouter

OpenClaw는 웹 검색을 위해 [Perplexity AI](https://www.perplexity.ai/)를 지원합니다. Perplexity의 API에 직접 연결하거나 [OpenRouter](https://openrouter.ai/)를 통해 연결할 수 있습니다.

- **기본값:** API 키를 인식할 수 없거나 없는 경우 OpenClaw는 기본적으로 **OpenRouter**(`https://openrouter.ai/api/v1`)를 사용합니다.
- **직접 Perplexity:** `pplx-`로 시작하는 API 키는 자동으로 `https://api.perplexity.ai`로 라우팅됩니다.
- **OpenRouter:** `sk-or-`로 시작하는 API 키는 OpenRouter로 라우팅됩니다.

### 설정

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "perplexity",
        "perplexity": {
          "apiKey": "pplx-your-perplexity-key",
          "model": "sonar-pro"
        }
      }
    }
  }
}
```

- **`apiKey`**: Perplexity 또는 OpenRouter 키입니다.
- **`baseUrl`**: (선택 사항) 기본 API 엔드포인트를 덮어씁니다.
- **`model`**: (선택 사항) 기본값은 `sonar-pro`입니다.

## Grok Search (xAI)

[xAI Grok](https://x.ai/)은 Responses API를 통해 웹 검색 도구를 제공합니다.

1.  **환경 변수:** 환경 변수에 `XAI_API_KEY`를 설정하세요.
2.  **설정:** `~/.openclaw/openclaw.json`을 업데이트하세요:

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "grok",
        "grok": {
          "apiKey": "your-xai-api-key"
        }
      }
    }
  }
}
```

### 게이트웨이 및 인증 오류 (Gateway & Authentication Errors)

웹 검색을 설정하는 동안 연결이 적절하게 인증되거나 보안이 유지되지 않으면 게이트웨이 수준의 보안 오류가 발생할 수 있습니다.

#### 허용되지 않은 오리진 (Origin not allowed)

**오류:** `origin not allowed (open the Control UI from the gateway host or allow it in gateway.controlUi.allowedOrigins)`

허용 리스트에 없는 다른 컴퓨터나 IP의 브라우저에서 OpenClaw Control UI에 액세스하려고 할 때 발생합니다.

**해결 방법:**
`openclaw.json`의 `gateway.controlUi.allowedOrigins`를 업데이트하여 브라우징 중인 컴퓨터의 IP 주소를 포함하거나, 임의의 오리진을 허용하려면 `"*"`를 사용하세요 (공개 네트워크에서는 권장되지 않음).

```json
{
  "gateway": {
    "controlUi": {
      "allowedOrigins": ["http://10.251.1.32:18789", "http://your-client-ip:port"]
    }
  }
}
```

#### 기기 식별 필요 (Device identity required)

**오류:** `device identity required` 또는 `control ui requires device identity (use HTTPS or localhost secure context)`

OpenClaw는 브라우저와 게이트웨이 사이의 연결을 보호하기 위해 기기 식별을 사용합니다. 이를 위해서는 브라우저의 암호화 API가 작동할 수 있도록 **보안 컨텍스트**(HTTPS 또는 `localhost`)가 필요합니다.

**해결 방법:**

1.  **Localhost 사용:** 게이트웨이가 같은 컴퓨터에서 실행 중인 경우 `http://localhost:18789`를 통해 UI에 액세스하세요.
2.  **HTTPS 사용:** 게이트웨이를 HTTPS로 제공하기 위해 리버스 프록시(예: Nginx, Caddy)를 TLS와 함께 설정하세요.
3.  **보안되지 않은 인증 (고급):** 사설 네트워크에서 반드시 HTTP를 사용해야 하는 경우 보안되지 않은 인증을 활성화할 수 있습니다 (권장되지 않음):

```json
{
  "gateway": {
    "controlUi": {
      "allowInsecureAuth": true,
      "dangerouslyDisableDeviceAuth": true
    }
  }
}
```

> [!WARNING]
> 기기 인증을 비활성화하거나 보안되지 않은 인증을 허용하면 게이트웨이가 세션 하이재킹에 노출될 수 있습니다. 신뢰할 수 있는 사설 네트워크에서만 이 설정을 사용하세요.

#### 사설 네트워크에서 평문 WebSocket 차단 (Plaintext WebSocket blocked on Private Network)

**오류:** `SECURITY ERROR: Gateway URL "ws://..." uses plaintext ws:// to a non-loopback address.`

신뢰할 수 있는 사설 네트워크(LAN) 환경에서 기존처럼 사용하시려면, 환경 변수를 통해 이 보안 체크를 일시적으로 허용해야 합니다.

터미널에서 다음과 같이 명령어를 실행해 보세요:

```bash
# 보안 체크 우회 옵션을 켜고 온보딩 실행
export OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1
pnpm openclaw onboard --install-daemon
```

또는 한 줄로 실행:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 pnpm openclaw onboard --install-daemon
```

**요약**

- **원인**: `bind: "lan"` 설정으로 인해 사설 IP를 사용하는데, 강화된 보안 정책이 `ws://` (평문) 연결을 차단함.
- **결과**: 게이트웨이 연결 실패로 인식되어 TUI/WEB 선택 메뉴가 스킵됨.
- **해결**: `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 환경 변수를 설정하여 보안 경고를 수동으로 허용.

이렇게 실행하시면 다시 TUI/WEB 선택 메뉴가 나타날 것입니다.

## 최종 체크리스트

- `~/.openclaw/openclaw.json`에 올바른 `baseUrl` 및 `allowPrivateNetwork` 설정이 포함되어 있는지 확인하세요.
- SearXNG `settings.yml`에 `json` 형식이 활성화되어 있고, 필요한 경우 Limiter 플러그인이 비활성화되어 있는지 확인하세요.
- 설정 변경 사항을 적용하려면 OpenClaw 데몬을 재시작하세요:
  ```bash
  pkill -f openclaw
  pnpm openclaw onboard --install-daemon
  ```
- Mattermost에서 간단한 검색을 테스트해 보세요:
  ```
  /ask search "내일 대전 날씨" freshness=pd
  ```
  403 오류 없이 결과가 나타나면 설정이 완료된 것입니다.

## 사용 예시

Mattermost에서 다음과 같이 OpenClaw에 웹 검색을 요청할 수 있습니다:

```
/ask search "내일 대전 날씨" freshness=pd
```

`freshness=pd` 플래그는 결과를 지난 하루로 제한합니다. 필요에 따라 프로바이더나 파라미터를 조정하세요.

> **참고:** `~/.openclaw/openclaw.json`을 수정한 후 변경 사항을 적용하려면 OpenClaw 데몬을 재시작하세요:
>
> ```bash
> pkill -f openclaw
> pnpm openclaw onboard --install-daemon
> ```
