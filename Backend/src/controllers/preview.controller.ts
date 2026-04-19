
import { Request, Response } from 'express';
import axios from 'axios';

export const getLinkPreview = async (req: Request, res: Response) => {
    try {
        const { url } = req.query;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Add protocol if missing
        let targetUrl = url;
        if (!/^https?:\/\//i.test(url)) {
            targetUrl = 'https://' + url;
        }

        // Fetch HTML with a generic user agent to avoid some bot blocks
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CluaizBot/1.0; +http://cluaiz.com)'
            },
            timeout: 5000 // 5 seconds timeout
        });

        const html = response.data;
        if (typeof html !== 'string') {
            return res.status(400).json({ error: 'Invalid response from URL' });
        }

        // Basic Regex Extraction for Open Graph Tags
        const getMetaTag = (prop: string) => {
            const regex = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
            const match = html.match(regex);
            if (match) return match[1];

            // Fallback to name attribute
            const regexName = new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
            const matchName = html.match(regexName);
            return matchName ? matchName[1] : null;
        };

        const getTitle = () => {
            const ogTitle = getMetaTag('og:title');
            if (ogTitle) return ogTitle;

            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            return titleMatch ? titleMatch[1] : null;
        };

        const getDescription = () => {
            return getMetaTag('og:description') || getMetaTag('description');
        };

        const getImage = () => {
            return getMetaTag('og:image');
        };

        const getSiteName = () => {
            return getMetaTag('og:site_name');
        }

        const metadata = {
            title: getTitle(),
            description: getDescription(),
            image: getImage(),
            url: targetUrl,
            siteName: getSiteName(),
            domain: new URL(targetUrl).hostname
        };

        return res.status(200).json(metadata);

    } catch (error) {
        console.error('Link preview error:', error);
        return res.status(500).json({ error: 'Failed to fetch link preview', details: (error as any).message });
    }
};
