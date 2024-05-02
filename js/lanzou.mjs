const baseURL = 'https://iuroc.lanzoue.com';
export const getDownloadURL = async (fileId) => {
    const fullURL = `${baseURL}/${fileId}`;
    const html = await fetch(fullURL).then(res => res.text());
    const iframeURLMatch = html.match(/src="(\/fn\?[^"]{20,})"/);
    if (!iframeURLMatch)
        throw new Error('获取 iframeURL 失败');
    const iframeURL = baseURL + iframeURLMatch[1];
    return fetchIframe(iframeURL);
};
const fetchIframe = async (iframeURL) => {
    const html = await fetch(iframeURL).then(res => res.text());
    const getValue = (varName) => {
        const regExp = new RegExp(`var ${varName} = '(.*?)'`);
        const match = html.match(regExp);
        if (!match)
            throw new Error(`获取 ${varName} 失败`);
        return match[1];
    };
    const getValueKey = (key) => {
        const regExp = new RegExp(`'${key}':([^,]+)`);
        const match = html.match(regExp);
        if (!match)
            throw new Error(`获取 ${key} 的值对应的变量名失败`);
        return match[1];
    };
    const signMatch = html.match(/'sign':'(.*?)'/);
    if (!signMatch)
        throw new Error('获取 sign 失败');
    const sign = signMatch[1];
    const params = [
        ['action', 'downprocess'],
        ['signs', getValue(getValueKey('signs'))],
        ['sign', sign],
        ['websign', getValue(getValueKey('websign'))],
        ['websignkey', getValue(getValueKey('websignkey'))],
        ['ves', '1']
    ];
    const postURLMatch = html.match(/url : '(.*?)'/);
    if (!postURLMatch)
        throw new Error('获取 postURL 失败');
    const postURL = postURLMatch[1];
    return ajaxm(postURL, params);
};
const ajaxm = async (url, params) => {
    const body = new URLSearchParams(params);
    const data = await fetch(`${baseURL}${url}`, {
        method: 'POST',
        body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': baseURL
        }
    }).then(res => res.json()).catch(error => { throw new Error('POST 响应非 JSON'); });
    if (data.dom && data.url)
        return `${data.dom}/file/${data.url}`;
    throw new Error('构建下载链接失败');
};
