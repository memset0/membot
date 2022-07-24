var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// adapters/kook/src/index.ts
var src_exports = {};
__export(src_exports, {
  HttpServer: () => HttpServer,
  Kook: () => types_exports,
  KookBot: () => KookBot,
  WsClient: () => WsClient,
  adaptAuthor: () => adaptAuthor,
  adaptGroup: () => adaptGroup,
  adaptSession: () => adaptSession,
  adaptUser: () => adaptUser,
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// adapters/kook/src/bot.ts
var import_satori4 = require("@satorijs/satori");
var import_fs = require("fs");

// adapters/kook/src/utils.ts
var import_satori = require("@satorijs/satori");

// adapters/kook/src/types.ts
var types_exports = {};
__export(types_exports, {
  Signal: () => Signal,
  Type: () => Type,
  UserStatus: () => UserStatus
});
var Signal = /* @__PURE__ */ ((Signal2) => {
  Signal2[Signal2["event"] = 0] = "event";
  Signal2[Signal2["hello"] = 1] = "hello";
  Signal2[Signal2["ping"] = 2] = "ping";
  Signal2[Signal2["pong"] = 3] = "pong";
  Signal2[Signal2["reconnect"] = 4] = "reconnect";
  Signal2[Signal2["resume"] = 5] = "resume";
  return Signal2;
})(Signal || {});
var Type = /* @__PURE__ */ ((Type2) => {
  Type2[Type2["text"] = 1] = "text";
  Type2[Type2["image"] = 2] = "image";
  Type2[Type2["video"] = 3] = "video";
  Type2[Type2["file"] = 4] = "file";
  Type2[Type2["unknown"] = 7] = "unknown";
  Type2[Type2["audio"] = 8] = "audio";
  Type2[Type2["kmarkdown"] = 9] = "kmarkdown";
  Type2[Type2["card"] = 10] = "card";
  Type2[Type2["system"] = 255] = "system";
  return Type2;
})(Type || {});
var UserStatus = /* @__PURE__ */ ((UserStatus2) => {
  UserStatus2[UserStatus2["normal"] = 0] = "normal";
  UserStatus2[UserStatus2["banned"] = 10] = "banned";
  return UserStatus2;
})(UserStatus || {});

// adapters/kook/src/utils.ts
var adaptGroup = /* @__PURE__ */ __name((data) => ({
  guildId: data.id,
  guildName: data.name
}), "adaptGroup");
var adaptUser = /* @__PURE__ */ __name((user) => ({
  userId: user.id,
  avatar: user.avatar,
  username: user.username,
  discriminator: user.identify_num
}), "adaptUser");
var adaptAuthor = /* @__PURE__ */ __name((author) => ({
  ...adaptUser(author),
  nickname: author.nickname
}), "adaptAuthor");
function adaptMessage(base, meta, session = {}) {
  if (meta.author) {
    session.author = adaptAuthor(meta.author);
    session.userId = meta.author.id;
  }
  if (base.type === 1 /* text */) {
    session.content = base.content.replace(/@(.+?)#(\d+)/,
      (_, $1, $2) => import_satori.segment.at($2, { name: $1 }))
      .replace(/@全体成员/, () => `[CQ:at,type=all]`)
      .replace(/@在线成员/, () => `[CQ:at,type=here]`)
      .replace(/@role:(\d+);/, (_, $1) => `[CQ:at,role=${$1}]`)
      .replace(/#channel:(\d+);/, (_, $1) => import_satori.segment.sharp($1));
  } else if (base.type === 2 /* image */) {
    session.content = (0, import_satori.segment)("image", { url: base.content, file: meta.attachments.name });
  } else if (base.type == 9/* KMarkdown */) {
    // console.log(base.content, base.extra.kmarkdown)
    session.content = base.content
      .replace(/\(met\)all\(met\)/g, () => `[CQ:at,type=all]`)
      .replace(/\(met\)here\(met\)/g, () => `[CQ:at,type=here]`)
      .replace(/\(chn\)(\d+)\(chn\)/g, (_, $1) => import_satori.segment.sharp($1))
    for (const mention of base.extra.kmarkdown.mention_part) {
      session.content = session.content
        .replace(`(met)${mention.id}(met)`, import_satori.segment.at(mention.id, { name: mention.username }))
    }
    for (const mention of base.extra.kmarkdown.mention_role_part) {
      session.content = session.content
        .replace(`(rol)${mention.role_id}(rol)`, `[CQ:at,role=${mention.role_id},name=${mention.name}]`)
    }
    session.content = session.content
      .replace(/\\\*/g, () => '*')
      .replace(/\\\\/g, () => '\\')
      .replace(/\\\(/g, () => '(')
      .replace(/\\\)/g, () => ')')
  } else if (base.type == 10/* Card */) {
  }
  return session;
}
__name(adaptMessage, "adaptMessage");
function adaptMessageSession(data, meta, session = {}) {
  adaptMessage(data, meta, session);
  session.messageId = data.msg_id;
  session.timestamp = data.msg_timestamp;
  const subtype = data.channel_type === "GROUP" ? "group" : "private";
  session.subtype = subtype;
  if (meta.quote) {
    session.quote = adaptMessage(meta.quote, meta.quote);
    session.quote.messageId = meta.quote.id;
    session.quote.channelId = session.channelId;
    session.quote.subtype = subtype;
  }
  return session;
}
__name(adaptMessageSession, "adaptMessageSession");
function adaptMessageCreate(data, meta, session) {
  adaptMessageSession(data, meta, session);
  session.guildId = meta.guild_id;
  session.channelName = meta.channel_name;
  if (data.channel_type === "GROUP") {
    session.subtype = "group";
    session.channelId = data.target_id;
  } else {
    session.subtype = "private";
    session.channelId = meta.code;
  }
}
__name(adaptMessageCreate, "adaptMessageCreate");
function adaptMessageModify(data, meta, session) {
  adaptMessageSession(data, meta, session);
  session.messageId = meta.msg_id;
  session.channelId = meta.channel_id;
}
__name(adaptMessageModify, "adaptMessageModify");
function adaptReaction(body, session) {
  session.channelId = body.channel_id;
  session.messageId = body.msg_id;
  session.userId = body.user_id;
  session["emoji"] = body.emoji.id;
}
__name(adaptReaction, "adaptReaction");
function adaptSession(bot, input) {
  const session = bot.session();
  // console.log('[input]', input);
  if (input.type === 255 /* system */) {
    const { type, body } = input.extra;
    switch (type) {
      case "updated_message":
      case "updated_private_message":
        session.type = "message-updated";
        adaptMessageModify(input, body, session);
        break;
      case "deleted_message":
      case "deleted_private_message":
        session.type = "message-deleted";
        adaptMessageModify(input, body, session);
        break;
      case "added_reaction":
      case "private_added_reaction":
        session.type = "reaction-added";
        adaptReaction(body, session);
        break;
      case "deleted_reaction":
      case "private_deleted_reaction":
        session.type = "reaction-deleted";
        adaptReaction(body, session);
        break;
      default:
        return;
    }
  } else {
    session.type = "message";
    adaptMessageCreate(input, input.extra, session);
    if (!session.content)
      return;
  }
  return session;
}
__name(adaptSession, "adaptSession");

// adapters/kook/src/bot.ts
var import_form_data = __toESM(require("form-data"));

// adapters/kook/src/ws.ts
var import_satori2 = require("@satorijs/satori");
var import_ws = __toESM(require("ws"));
var logger = new import_satori2.Logger("kaiheila");
var heartbeatIntervals = [6, 2, 4];
var WsClient = class extends import_satori2.Adapter.WsClient {
  constructor() {
    super(...arguments);
    this._sn = 0;
  }
  async prepare(bot) {
    const { url } = await bot.request("GET", "/gateway/index?compress=0");
    // console.log(url, await bot.request("GET", "/gateway/index?compress=0"));
    const headers = { Authorization: `Bot ${bot.config.token}`, "Content-Type": "application/json" };
    return new import_ws.default(url, { headers });
  }
  heartbeat(bot) {
    if (!bot.socket || bot.status !== "online") {
      clearInterval(this._heartbeat);
      return;
    }
    let trials = 0;
    let tmp = this;
    function send() {
      if (!bot.socket)
        return;
      if (trials >= 2) {
        return bot.socket.close(1013);
      }
      // console.log(bot.status, heartbeatIntervals[trials], { s: 2 /* ping */, sn: tmp._sn });
      bot.socket.send(JSON.stringify({ s: 2 /* ping */, sn: tmp._sn }));
      tmp._ping = setTimeout(send, heartbeatIntervals[trials++] * import_satori2.Time.second);
    }
    __name(send, "send");
    send();
  }
  async accept(bot) {
    this._sn = 0;
    clearInterval(this._heartbeat);
    bot.socket.on("message", async (data) => {
      let parsed;
      try {
        parsed = JSON.parse(data.toString());
      } catch (error) {
        return logger.warn("cannot parse message", data);
      }
      // console.log('[ws]', parsed);
      if (parsed.s === 0 /* event */) {
        this._sn = Math.max(this._sn, parsed.sn);
        const session = adaptSession(bot, { ...parsed.d.extra, ...parsed.d });
        // console.log('[session]', session);
        if (session) {
          // console.log('[session]', session);
          bot.dispatch(session);
        }
      } else if (parsed.s === 1 /* hello */) {
        this._heartbeat = setInterval(() => this.heartbeat(bot), import_satori2.Time.minute * 0.5);
        Object.assign(bot, await bot.getSelf());
        setTimeout(() => { bot.socket.send(JSON.stringify({ s: 2 /* ping */, sn: this._sn })); }, 2000);
        setTimeout(() => { bot.socket.send(JSON.stringify({ s: 2 /* ping */, sn: this._sn })); }, 6000);
        bot.online();
      } else if (parsed.s === 3 /* pong */) {
        clearTimeout(this._ping);
      } else if (parsed.s === 5 /* resume */) {
        bot.socket.close(1013);
      }
    });
  }
};
__name(WsClient, "WsClient");
((WsClient2) => {
  WsClient2.Config = import_satori2.Schema.intersect([
    import_satori2.Schema.object({
      protocol: import_satori2.Schema.const("ws").required(),
      token: import_satori2.Schema.string().description("机器人的用户令牌。").role("secret").required()
    }),
    import_satori2.Adapter.WsClient.Config
  ]);
})(WsClient || (WsClient = {}));

// adapters/kook/src/http.ts
var import_satori3 = require("@satorijs/satori");
var logger2 = new import_satori3.Logger("kaiheila");
var HttpServer = class extends import_satori3.Adapter.Server {
  constructor(ctx, bot) {
    super();
    let { path = "" } = bot.config;
    path = (0, import_satori3.sanitize)(path || "/kaiheila");
    ctx.router.post(path, (ctx2) => {
      const { body } = ctx2.request;
      logger2.debug("receive %o", body);
      // console.log('receive %o', body);
      const { challenge } = body.d;
      ctx2.status = 200;
      if (challenge) {
        ctx2.body = { challenge };
        return;
      }
      const bot2 = this.bots.find((bot3) => bot3.config.verifyToken === body.d.verify_token);
      if (!bot2)
        return;
      const session = adaptSession(bot2, body.d);
      if (session)
        bot2.dispatch(session);
    });
  }
  async start(bot) {
    Object.assign(bot, await bot.getSelf());
    bot.online();
  }
};
__name(HttpServer, "HttpServer");
((HttpServer2) => {
  HttpServer2.Config = import_satori3.Schema.object({
    protocol: import_satori3.Schema.const("http").required(),
    path: import_satori3.Schema.string().description("服务器监听的路径。").default("/kaiheila"),
    token: import_satori3.Schema.string().description("机器人的用户令牌。").role("secret").required(),
    verifyToken: import_satori3.Schema.string().description("机器人的验证令牌。").role("secret").required()
  });
})(HttpServer || (HttpServer = {}));

// adapters/kook/src/bot.ts
var attachmentTypes = ["image", "video", "audio", "file"];
var KookBot = class extends import_satori4.Bot {
  constructor(ctx, config) {
    super(ctx, config);
    this.http = ctx.http.extend({
      endpoint: "https://www.kaiheila.cn/api/v3",
      headers: {
        "Authorization": `Bot ${config.token}`,
        "Content-Type": "application/json"
      }
    }).extend(config);
    if (config.protocol === "http") {
      ctx.plugin(HttpServer, this);
    } else if (config.protocol === "ws") {
      ctx.plugin(WsClient, this);
    }
  }
  async request(method, path, data, headers = {}) {
    data = data instanceof import_form_data.default ? data : JSON.stringify(data);
    return (await this.http(method, path, { data, headers })).data;
  }
  async _prepareHandle(channelId, content, guildId) {
    let path;
    const params = {};
    const data = { type: "send", author: this, channelId, content, guildId };
    if (channelId.length > 30) {
      params.chat_code = channelId;
      data.subtype = "private";
      path = "/user-chat/create-msg";
    } else {
      params.target_id = channelId;
      data.subtype = "group";
      path = "/message/create";
    }
    const session = this.session(data);
    if (await this.context.serial(session, "before-send", session))
      return;
    return [path, params, session];
  }
  async _sendHandle([path, params, session], type, content) {
    params.type = type;
    params.content = content;
    // console.log('[handle]', { path, params, session, type, content })
    const message = await this.request("POST", path, params);
    // console.log('[handle-msg]', message);
    session.messageId = message.msg_id;
    this.context.emit(session, "send", session);
  }
  async _transformUrl({ type, data }) {
    if (data.url.startsWith("file://") || data.url.startsWith("base64://")) {
      const payload = new import_form_data.default();
      payload.append("file", data.url.startsWith("file://") ? (0, import_fs.createReadStream)(data.url.slice(8)) : Buffer.from(data.url.slice(9), "base64"));
      const { url } = await this.request("POST", "/asset/create", payload, payload.getHeaders());
      data.url = url;
    } else if (!data.url.includes("kaiheila")) {
      const res = await this.ctx.http.get(data.url, {
        headers: { accept: type },
        responseType: "stream"
      });
      const payload = new import_form_data.default();
      payload.append("file", res);
      const { url } = await this.request("POST", "/asset/create", payload, payload.getHeaders());
      data.url = url;
      console.log(url);
    }
  }
  async _sendCard(handle, chain, useMarkdown) {
    const type = useMarkdown ? "kmarkdown" : "plain-text";
    let text = { type, content: "" };
    let card = { type: "card", modules: [] };
    const output = [];
    const flushText = /* @__PURE__ */ __name(() => {
      text.content = text.content.trim();
      if (!text.content)
        return;
      card.modules.push({ type: "section", text });
      text = { type, content: "" };
    }, "flushText");
    const flushCard = /* @__PURE__ */ __name(() => {
      flushText();
      if (!card.modules.length)
        return;
      output.push(card);
      card = { type: "card", modules: [] };
    }, "flushCard");
    for (const { type: type2, data } of chain) {
      if (type2 === "text") {
        text.content += data.content;
      } else if (type2 === "at") {
        if (data.id) {
          text.content += `@user#${data.id}`;
        } else if (data.type === "all") {
          text.content += "@全体成员";
        } else if (data.type === "here") {
          text.content += "@在线成员";
        } else if (data.role) {
          text.content += `@role:${data.role};`;
        }
      } else if (type2 === "sharp") {
        text.content += `#channel:${data.id};`;
      } else if (attachmentTypes.includes(type2)) {
        flushText();
        await this._transformUrl({ type: type2, data });
        if (type2 === "image") {
          card.modules.push({
            type: "image-group",
            elements: [{
              type: "image",
              src: data.url
            }]
          });
        } else {
          card.modules.push({
            type: type2,
            src: data.url
          });
        }
      } else if (type2 === "card") {
        flushCard();
        output.push(JSON.parse(data.content));
      }
    }
    flushCard();
    await this._sendHandle(handle, 10 /* card */, JSON.stringify(output));
  }
  async _sendSeparate(handle, chain, useMarkdown) {
    let textBuffer = "";
    const type = useMarkdown ? 9 /* kmarkdown */ : 1 /* text */;
    const flush = /* @__PURE__ */ __name(async () => {
      textBuffer = textBuffer.trim();
      if (!textBuffer)
        return;
      await this._sendHandle(handle, type, textBuffer);
      handle[1].quote = null;
      textBuffer = "";
    }, "flush");
    for (const { type: type2, data } of chain) {
      if (type2 === "text") {
        textBuffer += data.content;
      } else if (type2 === "at") {
        if (data.id) {
          textBuffer += `@user#${data.id}`;
        } else if (data.type === "all") {
          textBuffer += "@全体成员";
        } else if (data.type === "here") {
          textBuffer += "@在线成员";
        } else if (data.role) {
          textBuffer += `@role:${data.role};`;
        }
      } else if (type2 === "sharp") {
        textBuffer += `#channel:${data.id};`;
      } else if (attachmentTypes.includes(type2)) {
        await flush();
        await this._transformUrl({ type: type2, data });
        await this._sendHandle(handle, Type[type2], data.url);
      } else if (type2 === "card") {
        await flush();
        await this._sendHandle(handle, 10 /* card */, JSON.stringify([JSON.parse(data.content)]));
      }
    }
    await flush();
  }
  async sendMessage(channelId, content, guildId) {
    const handle = await this._prepareHandle(channelId, content, guildId);
    const [, params, session] = handle;
    if (!(session == null ? void 0 : session.content))
      return [];
    let useMarkdown = false;
    const chain = import_satori4.segment.parse(session.content);
    if (chain[0].type === "quote") {
      params.quote = chain.shift().data.id;
    }
    if (chain[0].type === "markdown") {
      useMarkdown = true;
      chain.shift();
    }
    const { handleMixedContent } = this.config;
    const hasAttachment = chain.some((node) => attachmentTypes.includes(node.type));
    const useCard = hasAttachment && (handleMixedContent === "card" || handleMixedContent === "mixed" && chain.length > 1);
    // console.log('[sendmsg]', useCard, channelId, content, guildId);
    if (useCard) {
      await this._sendCard(handle, chain, useMarkdown);
    } else {
      await this._sendSeparate(handle, chain, useMarkdown);
    }
    return [session.messageId];
  }
  async sendPrivateMessage(target_id, content) {
    const { code } = await this.request("POST", "/user-chat/create", { target_id });
    return this.sendMessage(code, content);
  }
  async deleteMessage(channelId, msg_id) {
    if (channelId.length > 30) {
      await this.request("POST", "/user-chat/delete-msg", { msg_id });
    } else {
      await this.request("POST", "/message/delete", { msg_id });
    }
  }
  async editMessage(channelId, msg_id, content) {
    if (channelId.length > 30) {
      await this.request("POST", "/user-chat/update-msg", { msg_id, content });
    } else {
      await this.request("POST", "/message/update", { msg_id, content });
    }
  }
  async $createReaction(channelId, msg_id, emoji) {
    if (channelId.length > 30) {
      await this.request("POST", "/direct-message/add-reaction", { msg_id, emoji });
    } else {
      await this.request("POST", "/message/add-reaction", { msg_id, emoji });
    }
  }
  async $deleteReaction(channelId, messageId, emoji, user_id) {
    if (channelId.length > 30) {
      await this.request("POST", "/direct-message/delete-reaction", { msg_id: messageId, emoji });
    } else {
      await this.request("POST", "/message/delete-reaction", { msg_id: messageId, emoji, user_id });
    }
  }
  async getSelf() {
    const data = adaptUser(await this.request("GET", "/user/me"));
    data["selfId"] = data.userId;
    delete data.userId;
    return data;
  }
  async getGuildList() {
    const { items } = await this.request("GET", "/guild/list");
    return items.map(adaptGroup);
  }
  async getGuildMemberList() {
    const { items } = await this.request("GET", "/guild/user-list");
    return items.map(adaptAuthor);
  }
  async setGroupNickname(guild_id, user_id, nickname) {
    await this.request("POST", "/guild/nickname", { guild_id, user_id, nickname });
  }
  async leaveGroup(guild_id) {
    await this.request("POST", "/guild/leave", { guild_id });
  }
  async kickGroup(guild_id, user_id) {
    await this.request("POST", "/guild/kickout", { guild_id, user_id });
  }
};
__name(KookBot, "KookBot");
((KookBot2) => {
  KookBot2.Config = import_satori4.Schema.intersect([
    import_satori4.Schema.object({
      protocol: import_satori4.Schema.union(["http", "ws"]).description("选择要使用的协议。").required()
    }),
    import_satori4.Schema.union([
      WsClient.Config,
      HttpServer.Config
    ]),
    import_satori4.Schema.object({
      handleMixedContent: import_satori4.Schema.union([
        import_satori4.Schema.const("separate").description("将每个不同形式的内容分开发送"),
        import_satori4.Schema.const("card").description("使用卡片发送内容"),
        import_satori4.Schema.const("mixed").description("使用混合模式发送内容")
      ]).description("发送图文等混合内容时采用的方式。").default("separate")
    }).description("发送设置"),
    import_satori4.Schema.object({
      endpoint: import_satori4.Schema.string().role("url").description("要连接的服务器地址。").default("https://www.kaiheila.cn/api/v3"),
      proxyAgent: import_satori4.Schema.string().role("url").description("使用的代理服务器地址。"),
      headers: import_satori4.Schema.dict(String).description("要附加的额外请求头。"),
      timeout: import_satori4.Schema.natural().role("ms").description("等待连接建立的最长时间。")
    }).description("请求设置")
  ]);
})(KookBot || (KookBot = {}));
KookBot.prototype.platform = "kaiheila";

// adapters/kook/src/index.ts
var src_default = KookBot;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpServer,
  Kook,
  KookBot,
  WsClient,
  adaptAuthor,
  adaptGroup,
  adaptSession,
  adaptUser
});
//# sourceMappingURL=index.js.map
