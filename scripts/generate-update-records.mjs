import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';

const config = JSON.parse(readFileSync('package.json', 'utf8'));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

try {
    const hash = git('rev-parse', '--short', 'HEAD');
    let version = `${config.version}+${hash}`;
    try {
        const tag = git('describe', '--tags', '--exact-match', 'HEAD');
        if (/^v?\d+\.\d+\.\d+/.test(tag)) version = tag;
    } catch { /* 没有版本标签时使用 package 版本及提交号。 */ }

    // 使用参数数组执行 Git；记录按时间排列，不依赖 GitHub API。
    const commits = git('log', '-30', '--decorate=short', '--decorate-refs=refs/tags', '--date=short', '--format=%h%x09%ad%x09%s%d')
        .split('\n').filter(Boolean).map((line) => {
            const [hash, date, ...subject] = line.split('\t');
            return { hash, date, subject: subject.join('\t') };
        });
    writeFileSync('dist/data/updateRecords.json', JSON.stringify({
        version,
        fix: [], new: [], delete: [],
        update: commits.map(({ hash, date, subject }) => `${date} · ${subject} (${hash})`),
    }, null, 2) + '\n');
    // 压缩插件可能已生成旧手动日志的 gzip 副本，避免内容不一致。
    if (existsSync('dist/data/updateRecords.json.gz')) unlinkSync('dist/data/updateRecords.json.gz');
    console.log(`Generated update records: ${version}, ${commits.length} commits`);
} catch (error) {
    // ZIP/无 Git 环境仍可构建，保留 public/data 中的手动日志。
    console.warn(`Git update records unavailable; using manual records. ${error.message}`);
}
