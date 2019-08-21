# http-guild

[日本語](README.ja-jp.md)

http-guild is a guild-like HTTP server that mediates any web API requests and responses.

The client posts proxy request for any web API to http-guild. 
http-guild notifies the agent of the posted proxy request. The agent performs the contracted proxy request, and the result of it is reported to the client via http-guild.

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
    ||                  || [Request]          ||
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

The important point is that the agent takes the proxy request from http-guild and executes it.

Since there is no need to access clients and agents from http-guild, the following network configuration is possible.

```
LAN(a)         | WAN                  | LAN(b)
               |                      |
 +--------+  HTTP   +------------+  HTTP   +--------+  HTTP   +--------+
 | Client | ------> | http-guild | <------ | Agent  | ------> | Target |
 +--------+    |    +------------+    |    +--------+         +--------+
HTTP Client    |     HTTPS Server     |   HTTPS Client       HTTP Server
               |                      |
```

Here, the target is the Web API that the client originally wants to execute. And, since http-guild does not provide HTTPS, it is assumed that it will be used in combination with other HTTPS servers for security reasons.

NOTE: This project is experimental. In most cases, using SSH port forwarding makes the network simpler.

---
Now writing... see README.ja-jp.md.
