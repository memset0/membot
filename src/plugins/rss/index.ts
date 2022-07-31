import { Context, Logger } from 'koishi'

import { RSSCore, fetchTitle, fetchRSS } from './core'
import { Config, Feed, FeedItem, RSSOptions } from './types'

declare module 'koishi' {
  interface Modules {
    rss: typeof import('.')
  }

  interface Tables {
    rssfeed: Feed
  }
}


const logger = new Logger('rss')

export const name = 'RSS'
export const using = ['database'] as const


export function apply(ctx: Context, config: Config) {
  ctx.model.extend('rssfeed', {
    id: 'unsigned',
    channel: 'string',
    url: 'string',
    title: 'string',
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
    ...config,
  } as Config

  const core = new RSSCore(ctx, config)
  ctx.on('ready', async () => { await core.initialize() })
  ctx.on('dispose', () => { core.destroy() })

  ctx.command('rss.sub <url:text>', '订阅 RSS', { authority: 3 })
    .option('title', '-t 设置标题')
    .option('refresh', '-r 设置刷新时间')
    .action(async ({ session, options }, url: string) => {
      if (!url) { return session.execute('help rss.sub') }
      const channel = `${session.platform}:${session.channelId}`

      let payload: FeedItem
      try {
        payload =( await fetchRSS(url, config.timeout, config.userAgent))[0]
        console.log(payload)
      } catch (error) {
        logger.warn('err', error)
        return `无法订阅此链接`
      }

      const feed = await core.subscribe({
        channel,
        url,
        title: options.title || (await fetchTitle(url)) || '',
        refresh: options.refresh || config.refresh,
        last_update: new Date(),
        options: {} as RSSOptions
      } as Feed)
      logger.info('sub', feed)
      session.send(`#${feed.id} 订阅成功！`)
      logger.info('sub demo', payload)
      await core.receive(feed, payload)
    })

  ctx.command('rss.reset', '重置 RSS 订阅', { authority: 4 })
    .action(async ({ session }) => {
      await core.reset()
    })
}