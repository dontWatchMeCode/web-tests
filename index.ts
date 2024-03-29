import { runSSL } from './src/ssl'
import { runCrawler } from './src/crawler'
import { runOffline } from './src/offline'

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

switch (process.argv[2]) {
    case 'ssl':
        runSSL()
        break
    case 'crawl':
        runCrawler()
        break
    case 'offline':
        runOffline()
        break

    default:
        throw new Error('Not a valid argument')
}
