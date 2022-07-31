import { Context } from 'koishi'
import RssFeedEmitter from 'rss-feed-emitter'


export const name = 'test-feeder'

export async function apply(ctx: Context) {
	const logger = ctx.logger(name)

	const feeder = new RssFeedEmitter({ skipFirstLoad: true });

	feeder.add({
		url: 'http://www.nintendolife.com/feeds/news',
		refresh: 2000,
		eventName: 'nintendo'
	});
	logger.info(feeder.list)
	
	feeder.add({
		url: 'http://www.nintendolife.com/feeds/news',
		refresh: 2000,
		eventName: 'nintendo2'
	});
	logger.info(feeder.list)

	feeder.remove('http://www.nintendolife.com/feeds/news');
	logger.info(feeder.list)

	feeder.destroy();
}