import { Context, Logger, segment } from 'koishi'

import { RSSCore, fetchTitle, fetchRSS } from './core'
import { Config, Feed, FeedItem, RSSOptions } from './types'
import { escapeTelegramHTML } from '../../utils/string'

declare module 'koishi' {
  interface Modules {
    rss: typeof import('.')
  }

  interface Tables {
    rssfeed: Feed
  }
}


export const name = 'rss'
export const using = ['database'] as const


export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger('rss')

  ctx.model.extend('rssfeed', {
    id: 'unsigned',
    channel: 'string',
    url: 'string',
    refresh: 'unsigned',
    last_update: 'timestamp',
    options: 'json',
  }, {
    autoInc: true,
  })

  config = {
    timeout: 3000,
    refresh: 1000 * 60 * 10,
    userAgent: '',
    defaults: {},
    ...config,
  } as Config

  const core = new RSSCore(ctx, config)
  ctx.on('ready', async () => { await core.initialize() })
  ctx.on('dispose', () => { core.destroy() })

  ctx.command('rss.sub <url:text>', '订阅 RSS', { authority: 3 })
    .option('title', '-t 设置标题')
    .option('refresh', '-r 设置刷新时间')
    .action(async ({ session, options }, url: string) => {
      if (!url) {
        return session.execute('help rss.sub')
      }
      const channel = `${session.platform}:${session.channelId}`

      let payload: FeedItem
      try {
        payload = (await fetchRSS(url, config.timeout, config.userAgent))[0]
      } catch (error) {
        logger.warn('err', error)
        return `无法订阅此链接`
      }

      const feed = await core.subscribe({
        channel,
        url,
        refresh: options.refresh || config.refresh,
        last_update: new Date(),
        options: {
          title: options.title || (await fetchTitle(url)) || '',
        } as RSSOptions
      } as Feed)
      await session.send(`#${feed.id} 订阅成功！`)
      await core.receive(feed, payload)
    })

  ctx.command('rss.unsub <id:number>', '取消订阅 RSS', { authority: 3 })
    .action(async ({ session, options }, id: number) => {
      if (!id) {
        return session.execute('help rss.unsub')
      }
      const channel = `${session.platform}:${session.channelId}`

      try {
        await core.unsubscribe(id)
        return '取消订阅成功'
      } catch (error) {
        logger.warn(session.content, error)
        return '取消订阅失败'
      }
    })

  ctx.command('rss.update <id:number>', '更新 RSS 订阅', { authority: 3 })
    .action(async ({ session, options }, id: number) => {
      if (!id) {
        return session.execute('help rss.update')
      }

      const feed = (await ctx.database.get('rssfeed', [id]))[0] as Feed
      const payload = (await fetchRSS(feed.url, config.timeout, config.userAgent))[0]
      await core.receive(feed, payload)
    })

  ctx.command('rss.import <json:text>', '导入 RSS 订阅', { authority: 4 })
    .option('confirmed', '-y 确认')
    .action(async ({ session, options }, json: string) => {
      if (!json) {
        return session.execute('help rss.import')
      }
      if (!options.confirmed) {
        return '真的要导入 RSS 订阅吗？将会覆盖本频道现有订阅。带 -y 参数执行以确认操作。'
      }

      const channel = `${session.platform}:${session.channelId}`
      const data = JSON.parse(json)
      await ctx.database.remove('rssfeed', { channel })
      await core.reload()

      try {
        for (const feed of data) {
          if (feed.id) { delete feed.id }
          feed.channel = channel
          await session.send(`导入 ${feed.title}（${feed.url}）`)
          await fetchRSS(feed.url, config.timeout, config.userAgent)
          await core.subscribe(feed)
        }
        return '导出成功'
      } catch (error) {
        logger.warn(error)
        return '导入失败'
      }
    })

  ctx.command('rss.export', '导出 RSS 订阅', { authority: 4 })
    .option('confirmed', '-y 确认')
    .action(async ({ session, options }) => {
      if (!options.confirmed) {
        return '真的要导出 RSS 订阅吗？将可能泄露 RSS 订阅链接。带 -y 参数执行以确认操作。'
      }

      const channel = `${session.platform}:${session.channelId}`
      const data: Feed[] = await ctx.database.get('rssfeed', { channel })
      for (const feed of data) {
        if (feed.id) { delete feed.id }
        if (feed.channel) { delete feed.channel }
      }
      const json = JSON.stringify(data, null, 2)
      if (session.platform === 'telegram') {
        return segment('html') +
          `频道 ${channel} 的所有订阅数据\n` +
          '<pre><code class="language-json">' +
          escapeTelegramHTML(json) +
          '</code></pre>'
      } else {
        return `频道 ${channel} 的所有订阅数据\n${json}`
      }
    })

  ctx.command('rss.reset', '重置 RSS 订阅', { authority: 4 })
    .option('confirmed', '-y 确认')
    .action(async ({ options }) => {
      if (!options.confirmed) {
        return '真的要重置 RSS 订阅吗？带 -y 参数执行以确认操作。'
      }

      await ctx.database.remove('rssfeed', { id: { $gt: 0 } })
      await core.reload()
      return 'RSS 订阅已重置'
    })
}