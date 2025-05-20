export const WHITE_LIST = [];
export const BLACK_LIST = [];
export function isAllowedUrl(url) {
    for (const pattern of BLACK_LIST) {
        if (pattern.test(url)) {
            console.log(`[Security] URL 被黑名单拒绝: ${url}`);
            return false;
        }
    }
    if (WHITE_LIST.length > 0) {
        for (const pattern of WHITE_LIST) {
            if (pattern.test(url)) {
                return true;
            }
        }
        console.log(`[Security] URL 不在白名单内: ${url}`);
        return false;
    }
    return true;
}
