# http-guild

[English](README.md)

http-guildは任意のWeb APIのリクエストとレスポンスを仲介するギルドのようなHTTPサーバーです。

クライアントはhttp-guildに任意のWeb APIの代行依頼を投稿します。http-guildは投稿された代行依頼をエージェントに知らせます。エージェントは請け負った代行依頼を実行し、その結果はhttp-guildを介してクライアントに報告されます。

```
+--------+        +------------+          +--------+
| Client |        | http-guild |          | Agent  |
+---||---+        +-----||-----+          +---||---+
    ||                  ||                    ||
    || Post request     ||                    ||
    || ---------------> ||                    ||
    ||                  || Notify request     ||
    ||                  || --+                ||
    ||                  ||   |                ||
    ||                  || <-+                ||
    ||                  ||                    ||
    ||                  ||       Take request ||
    ||                  || <----------------- ||
    ||                  || [Proxy Request]    ||
    ||                  || - - - - - - - - -> ||
    ||                  ||                    ||
    ||                  ||      Report result ||
    || [Request result] || <----------------- ||
    || <- - - - - - - - ||                    ||
    ||                  ||                    ||
+---||---+        +-----||-----+          +---||---+
| Client |        | http-guild |          | Agent  |
+--------+        +------------+          +--------+
```

重要な点は、エージェントがhttp-guildから代行依頼を持って行き、実行することです。

http-guildからクライアントとエージェントにアクセスする必要がない為、次のようなネットワーク構成が可能です。

```
LAN(a)         | WAN                  | LAN(b)
               |                      |
 +--------+  HTTP   +------------+  HTTP   +--------+  HTTP   +--------+
 | Client | ------> | http-guild | <------ | Agent  | ------> | Target |
 +--------+    |    +------------+    |    +--------+         +--------+
HTTP Client    |     HTTPS Server     |   HTTPS Client       HTTP Server
               |                      |
```

ここで、ターゲットは本来クライアントが実行したいWeb APIです。また、http-guildはHTTPSを提供しないため、セキュリティ上の理由から他のHTTPSサーバーと組み合せて利用することを想定してます。

NOTE: このプロジェクトは実験的なものです。ほとんどのケースでSSHポートフォワーディングを採用した方がネットワークがシンプルになります。

## Client Web API

クライアントはhttp-guildにWeb APIの代行依頼を投稿します。

http-guildはHTTP/1.1をサポートします。

### POST /v1/request

Web APIの代行依頼を投稿し、代行の結果を回収します。

#### request

ターゲットのWeb APIのHTTPメソッドとリクエストURIはクエリパラメータで指示します。

- method: HTTPメソッドを指示します。(mandantory)
- uri: リクエストURIを指示します。(mandantory)

メッセージボディと、それに関するヘッダフィールドはhttp-guildでは使用せず、エージェントにWeb APIの実行の為の情報として渡ります。

メッセージボディに関するヘッダフィールドとして次のものに対応します。

- Content-Length
- Content-Type

e.g.
```
POST /v1/request?method=POST&uri=/test?a=1%26b=2 HTTP/1.1
Host: api.http-guild.example
Content-Length: 2
Content-Type: application/json

{}
```

ターゲットのWeb APIの実行に必要なヘッダフィールドは`X-Guild-Proxy-`のプリフィックスを付けて指示します。

ただし、`Content-Length`と`Content-Type`は前述の方法で指定する為、`X-Guild-Proxy-Content-Length`と`X-Guild-Proxy-Content-Type`は無視されます。

e.g.
```
POST /v1/request?method=GET&uri=/info HTTP/1.1
Host: api.http-guild.example
Content-Length: 0
X-Guild-Proxy-Accept: application/json
X-Guild-Proxy-X-Parameter: 42

```

また、http-guildに対して次のヘッダフィールドを用意してます。

- X-Guild-Condition: 代行が可能なエージェントを制限する為に使用します。詳細は`GET /v1/request`を参照ください。デフォルトは`*`です。
- X-Guild-Timeout: 代行の結果を待つ時間をミリ秒単位で指示します。時間以内に結果が得られなかった場合はレスポンスのステータスコードがエラーを示します。デフォルトは`5000`です。

#### response

ステータスコードはターゲットのWeb APIの結果に依らずhttp-guildが使用します。

エージェントから代行の結果を回収できた場合は`200 OK`、タイムアウトの場合は`504 Gateway Timeout`となります。

ターゲットのWeb APIのステータスコードはヘッダフィールドの`X-Guild-Report-Status`で示します。


## Agent Web API

エージェントはhttp-guildからWeb APIの代行依頼の請け負いと、代行結果の報告を行います。

http-guildはHTTP/1.1をサポートします。

### GET /v1/request

Web APIの代行依頼を請け負います。

#### request

クライアントからの代行依頼は`X-Guild-Condition`によってエージェントに条件が提示されている場合があります。ヘッダフィールドの`X-Guild-Ability`で実行可能なWeb APIを示します。

e.g.
```
GET /v1/request HTTP/1.1
Host: api.http-guild.example
Content-Length: 0
X-Guild-Ability: audio,japan

```

`X-Guild-Ability`とクライアントが投稿する代行依頼の`X-Guild-Condition`はcsvです。`X-Guild-Ability`が`X-Guild-Condition`のすべての値を含む場合に、その代行依頼を請け負うことが可能です。

#### response

ステータスコードは代行依頼を請け負った場合は`200 OK`、請け負える代行依頼がなかった場合は`204 No Content`となります。

代行依頼を取得した場合は、メッセージボディはターゲットのWeb APIの情報をまとめたrequest.jsonとbodyをzipにアーカイブしたものになります。

request.jsonは次のようになります。

```
{
    "id": "abc",
    "method": "POST",
    "uri": "/test?a=1&b=2",
    "headers": {
        "Content-Length": 2,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Parameter: 42
    },
    "condition": [
        "audio",
        "japan"
    ]
}
```

`id`は代行依頼に固有な識別子です。結果を報告する際に使用します。

この場合bodyはjsonになります。


ただし、これらの解釈はエージェントに委任されます。


### POST /v1/reports/{requestId}

Web APIの代行結果を報告します。

#### request

URIパラメータのrequestIdは代行依頼を請け負った際に取得したものを使用します。

FIXME: unzipが面倒なので`POST /v1/request`と同様にした方が良さそう

メッセージボディはターゲットのWeb APIの結果をまとめたreport.jsonとbodyをzipにアーカイブしたものになります。

report.jsonは次のようになります。

```
{
    "requestId": "abc",
    "status": 200,
    "headers": {
        "Content-Length": 12345,
        "Content-Type": "image/png"
    }
}
```

この場合bodyはpngになります。

#### response

ステータスコードは報告に成功した場合は`200 OK`、既にクライアントがタイムアウトで代行の結果報告を断念していた場合は`504 Gateway Timeout`となります。


## Data Flow

```
+---------------------------+
| Client                    |
+---------------------------+
 |                         A
[Proxy request]            |
 |                         |
 |           [Request result]
 V                         |
+---------------------------+
| http-guild                |
+---------------------------+
 |                         A
[request.zip]              |
 |                         |
 |               [report.zip]
 V                         |
+---------------------------+
| Agent                     |
+---------------------------+
 |                         A
[Request]                  |
 |                 [Response]
 V                         |
+---------------------------+
| Target                    |
+---------------------------+
```
