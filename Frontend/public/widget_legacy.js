(function () {
    'use strict';

    // ========================================
    // 🔔 HEARTBEAT SYSTEM - Auto Deployment Detection
    // ========================================
    // ========================================
    // 🔔 HEARTBEAT SYSTEM - Auto Deployment Detection
    // ========================================
    (function initHeartbeat() {
        const scriptTag = document.currentScript || document.querySelector('script[data-org-id]');
        const orgId = scriptTag?.getAttribute('data-org-id');

        if (!orgId) {
            console.warn('⚠️ Cluaiz: Missing data-org-id attribute');
            return;
        }

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const API_URL = isLocal ? 'http://localhost:4000/v1' : 'https://api.cluaiz.com/v1';

        // FETCH CONFIGURATION FROM BACKEND
        const fetchConfig = async () => {
            try {
                console.log('🔄 Cluaiz: Fetching remote configuration for org:', orgId);
                // Assumption: specific bot ID is 'default-bot' for now, or we define an endpoint that resolves via OrgID
                // Using default-bot as per current architecture
                const response = await fetch(`${API_URL}/bots/default-bot/config`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'x-org-id': orgId }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.widgetConfig) {
                        console.log('✅ Cluaiz: Configuration received', data.widgetConfig);
                        // Save to localStorage for persistence/caching
                        localStorage.setItem('cluaiz-widget-config', JSON.stringify(data.widgetConfig));
                        // Trigger customization
                        applyCustomization();
                    }
                }
            } catch (error) {
                console.error('❌ Cluaiz: Config fetch error', error);
            }
        };

        // Initial Fetch
        fetchConfig();

        const sendHeartbeat = async () => {
            try {
                const response = await fetch(`${API_URL}/widget/heartbeat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orgId: orgId,
                        url: window.location.href,
                        hostname: window.location.hostname,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent
                    })
                });

                if (response.ok) {
                    console.log('✅ Cluaiz: Heartbeat sent successfully');
                }
            } catch (error) {
                console.error('❌ Cluaiz: Heartbeat error', error);
            }
        };

        sendHeartbeat();
        setInterval(sendHeartbeat, 5 * 60 * 1000);
    })();

    // ========================================
    // 🎨 ICON TEMPLATES
    // ========================================
    const SIMPLE_ICONS = {
        chat: `
            <div class="cluaiz-box">
                <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 116 123" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                        <path d="M17.2,0h59.47c4.73,0,9.03,1.93,12.15,5.05c3.12,3.12,5.05,7.42,5.05,12.15v38.36c0,4.73-1.93,9.03-5.05,12.15 c-3.12,3.12-7.42,5.05-12.15,5.05H46.93L20.81,95.21c-1.21,1.04-3.04,0.9-4.08-0.32c-0.51-0.6-0.74-1.34-0.69-2.07l1.39-20.07H17.2 c-4.73,0-9.03-1.93-12.15-5.05C1.93,64.59,0,60.29,0,55.56V17.2c0-4.73,1.93-9.03,5.05-12.15C8.16,1.93,12.46,0,17.2,0L17.2,0z M102.31,27.98c3.37,0.65,6.39,2.31,8.73,4.65c3.05,3.05,4.95,7.26,4.95,11.9v38.36c0,4.64-1.89,8.85-4.95,11.9 c-3.05,3.05-7.26,4.95-11.9,4.95h-0.61l1.42,20.44l0,0c0.04,0.64-0.15,1.3-0.6,1.82c-0.91,1.07-2.52,1.19-3.58,0.28l-26.22-23.2 H35.01l17.01-17.3h36.04c7.86,0,14.3-6.43,14.3-14.3V29.11C102.35,28.73,102.34,28.35,102.31,27.98L102.31,27.98z M25.68,43.68 c-1.6,0-2.9-1.3-2.9-2.9c0-1.6,1.3-2.9,2.9-2.9h30.35c1.6,0,2.9,1.3,2.9,2.9c0,1.6-1.3,2.9-2.9,2.9H25.68L25.68,43.68z M25.68,29.32c-1.6,0-2.9-1.3-2.9-2.9c0-1.6,1.3-2.9,2.9-2.9H68.7c1.6,0,2.9,1.3,2.9,2.9c0,1.6-1.3,2.9-2.9,2.9H25.68L25.68,29.32z M76.66,5.8H17.2c-3.13,0-5.98,1.28-8.05,3.35C7.08,11.22,5.8,14.06,5.8,17.2v38.36c0,3.13,1.28,5.98,3.35,8.05 c2.07,2.07,4.92,3.35,8.05,3.35h3.34v0.01l0.19,0.01c1.59,0.11,2.8,1.49,2.69,3.08l-1.13,16.26L43.83,67.8 c0.52-0.52,1.24-0.84,2.04-0.84h30.79c3.13,0,5.98-1.28,8.05-3.35c2.07-2.07,3.35-4.92,3.35-8.05V17.2c0-3.13-1.28-5.98-3.35-8.05 C82.65,7.08,79.8,5.8,76.66,5.8L76.66,5.8z" />
                    </svg>
                </div>
            </div>
        `,
        message: `
            <div class="cluaiz-box">
                <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 123 107" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                        <path d="M56,92.15a38.3,38.3,0,0,0,11.23,5.78c8.41,2.66,17.75,2.25,27.12-1.74a2.72,2.72,0,0,1,2-.08l12,4L107,90.36a2.78,2.78,0,0,1,1-2.53,28.41,28.41,0,0,0,6.31-6.8,17.53,17.53,0,0,0,2.73-12.47,27,27,0,0,0-6-12.5c-.6-.76-1.25-1.5-1.92-2.23h0a42.62,42.62,0,0,0,1.27-6.59,50,50,0,0,1,5,5.34,32.71,32.71,0,0,1,7.14,15.14A23,23,0,0,1,119.05,84a32.7,32.7,0,0,1-6.29,7.12l1.61,12.4a2.79,2.79,0,0,1-3.6,3.21l-15.24-5a43.85,43.85,0,0,1-30,1.53A45,45,0,0,1,47.47,92.16c.65,0,1.33.06,2.06.09,2.18.06,4.34,0,6.46-.1ZM72.11,35.22a6.39,6.39,0,1,1-6.38,6.39,6.39,6.39,0,0,1,6.38-6.39Zm-42.18,0a6.39,6.39,0,1,1-6.38,6.39,6.39,6.39,0,0,1,6.38-6.39Zm21.09,0a6.39,6.39,0,1,1-6.38,6.39A6.38,6.38,0,0,1,51,35.22ZM52.3,0h.05C66.29.46,78.79,5.42,87.74,13.09,96.89,20.93,102.37,31.6,102,43.26v0c-.36,11.66-6.48,22-16.1,29.3-9.41,7.14-22.22,11.36-36.16,11A62.05,62.05,0,0,1,38.5,82.2a58.64,58.64,0,0,1-9.43-2.87l-22.83,9,7.65-18.19a42.35,42.35,0,0,1-10-12.73A35.22,35.22,0,0,1,0,40.3C.37,28.63,6.49,18.28,16.11,11,25.53,3.83,38.33-.38,52.28,0Zm-.17,6.35h-.05C39.62,6,28.25,9.74,19.94,16,11.83,22.2,6.66,30.83,6.37,40.47A29.15,29.15,0,0,0,9.56,54.53,36.92,36.92,0,0,0,19.7,66.69l1.89,1.51-3.65,8.67,11.21-4.41,1.2.51a52.07,52.07,0,0,0,9.47,3A57,57,0,0,0,49.94,77.2c12.47.36,23.85-3.36,32.16-9.66,8.11-6.16,13.28-14.79,13.57-24.43v0C96,33.44,91.32,24.54,83.6,17.92c-7.91-6.78-19-11.16-31.45-11.54Z" />
                    </svg>
                </div>
            </div>
        `,
        comment: `
            <div class="cluaiz-box">
                <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 123 123" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                        <path d="M31.23,113.89,30,115.11a5.2,5.2,0,0,1-9-3.48V99.45H19.39A9,9,0,0,1,13,96.79a9.28,9.28,0,0,1-1.82-2.61h-.44A10.75,10.75,0,0,1,0,83.45V10.73A10.68,10.68,0,0,1,2.8,3.56l.36-.4A10.72,10.72,0,0,1,10.73,0h94.41A10.81,10.81,0,0,1,115.7,8.79a9.2,9.2,0,0,1,4.51,2.47,9.05,9.05,0,0,1,2.67,6.4V90.38a9.08,9.08,0,0,1-9.07,9.07h-54L37.39,120.93a3.54,3.54,0,0,1-6.16-2.37v-4.67ZM27.94,60.37a3.54,3.54,0,0,1,0-7.07H76.87a3.54,3.54,0,1,1,0,7.07Zm0-23a3.54,3.54,0,0,1,0-7.07h60a3.54,3.54,0,0,1,0,7.07ZM26.1,111.63,49.71,89h55.43a5.55,5.55,0,0,0,5.54-5.53V10.73a5.58,5.58,0,0,0-5.54-5.53H10.73A5.59,5.59,0,0,0,5.2,10.73V83.45A5.57,5.57,0,0,0,10.73,89H26.1v22.65Z"/>
                    </svg>
                </div>
            </div>
        `,
        icon6: {
            solid: `
                <div class="cluaiz-box">
                    <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                        <svg viewBox="0 0 122.88 86.411" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                            <g><path d="M57.055,28.881c-3.2,0-5.796,2.596-5.796,5.796s2.596,5.796,5.796,5.796c3.201,0,5.796-2.596,5.796-5.796 S60.255,28.881,57.055,28.881L57.055,28.881z M21.489,28.881c-3.201,0-5.796,2.596-5.796,5.796s2.596,5.796,5.796,5.796 s5.796-2.596,5.796-5.796S24.689,28.881,21.489,28.881L21.489,28.881z M39.271,28.881c-3.201,0-5.796,2.596-5.796,5.796 s2.595,5.796,5.796,5.796s5.796-2.596,5.796-5.796S42.472,28.881,39.271,28.881L39.271,28.881z M83.299,8.182h25.468 c7.763,0,14.113,6.351,14.113,14.113v24.907c0,7.761-6.352,14.113-14.113,14.113H97.803c1.568,6.206,3.468,11.781,9.272,16.929 c-11.098-2.838-19.665-8.576-25.952-16.929h-1.896c-0.736,0-1.509-0.059-2.302-0.168c4.193-3.396,7.105-7.659,7.105-12.275V38.493 c0.926,0.643,2.052,1.021,3.264,1.021c3.164,0,5.73-2.566,5.73-5.729s-2.566-5.729-5.73-5.729c-1.212,0-2.338,0.377-3.264,1.02 V13.535C84.031,11.683,83.774,9.888,83.299,8.182L83.299,8.182z M105.571,28.056c-3.164,0-5.729,2.566-5.729,5.729 s2.565,5.729,5.729,5.729s5.729-2.566,5.729-5.729S108.735,28.056,105.571,28.056L105.571,28.056z M19.542,0H59h0.004v0.014 c5.386,0.002,10.27,2.193,13.8,5.724l-0.007,0.007c3.536,3.539,5.73,8.422,5.731,13.796h0.014v0.002h-0.014v28.184h0.014v0.003 h-0.014c-0.002,5.746-3.994,10.752-9.312,14.248c-4.951,3.256-11.204,5.277-16.247,5.277v0.015h-0.002v-0.015h-0.404 c-3.562,4.436-7.696,8.225-12.429,11.333c-5.235,3.438-11.157,6.028-17.799,7.727l-0.003-0.012c-1.25,0.315-2.628-0.06-3.541-1.091 c-1.302-1.472-1.165-3.721,0.307-5.023c2.896-2.567,4.816-5.239,6.207-8.041c0.774-1.559,1.398-3.188,1.939-4.878h-7.702h-0.004 v-0.015c-5.385-0.001-10.27-2.193-13.799-5.723c-3.532-3.531-5.724-8.417-5.725-13.804H0v-0.002h0.014V19.542H0v-0.005h0.014 C0.016,14.263,2.126,9.466,5.541,5.952c0.062-0.073,0.127-0.145,0.196-0.214c3.531-3.531,8.417-5.724,13.803-5.725V0H19.542 L19.542,0z"/></g>
                        </svg>
                    </div>
                </div>
            `,
            outline: `
                <div class="cluaiz-box">
                    <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                        <svg viewBox="0 0 122.88 86.411" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:none; stroke:var(--icon-stroke, var(--icon-color, white)); stroke-width:var(--icon-stroke-width, 2px);">
                           <g><path fill-rule="evenodd" clip-rule="evenodd" d="M83.298,8.182h25.469c7.763,0,14.113,6.351,14.113,14.113v24.907 c0,7.761-6.352,14.113-14.113,14.113H97.802c1.569,6.206,3.469,11.781,9.272,16.929c-11.098-2.838-19.664-8.576-25.952-16.929 h-1.895c-0.737,0-1.509-0.058-2.303-0.168c4.193-3.396,7.106-7.659,7.106-12.275V38.493c0.926,0.644,2.051,1.021,3.264,1.021 c3.164,0,5.73-2.566,5.73-5.729s-2.566-5.729-5.73-5.729c-1.213,0-2.338,0.377-3.264,1.02V13.535 C84.031,11.683,83.774,9.888,83.298,8.182L83.298,8.182z M57.055,28.881c-3.201,0-5.796,2.596-5.796,5.796s2.596,5.796,5.796,5.796 c3.2,0,5.796-2.596,5.796-5.796S60.255,28.881,57.055,28.881L57.055,28.881z M21.488,28.881c-3.201,0-5.796,2.596-5.796,5.796 s2.596,5.796,5.796,5.796s5.796-2.596,5.796-5.796S24.689,28.881,21.488,28.881L21.488,28.881z M39.271,28.881 c-3.201,0-5.796,2.596-5.796,5.796s2.595,5.796,5.796,5.796s5.796-2.596,5.796-5.796S42.472,28.881,39.271,28.881L39.271,28.881z M59,3.572H19.542c-8.785,0-15.971,7.187-15.971,15.971v28.184c0,8.783,7.188,15.971,15.971,15.971h12.407 c-1.775,7.022-3.924,13.332-10.493,19.156c12.558-3.211,22.252-9.704,29.367-19.156h2.145c8.783,0,22.002-7.187,22.002-15.971 V19.542C74.971,10.759,67.784,3.572,59,3.572L59,3.572z M19.542,0H59h0.005v0.014c5.386,0.002,10.27,2.193,13.8,5.724l-0.008,0.007 c3.536,3.539,5.731,8.422,5.732,13.796h0.014v0.002h-0.014v28.184h0.014v0.003h-0.014c-0.002,5.746-3.994,10.752-9.312,14.248 c-4.952,3.256-11.205,5.277-16.247,5.277v0.015h-0.002v-0.015h-0.404c-3.562,4.436-7.696,8.225-12.43,11.333 c-5.235,3.438-11.157,6.028-17.799,7.727l-0.003-0.012c-1.25,0.315-2.628-0.06-3.541-1.091c-1.302-1.472-1.165-3.721,0.307-5.023 c2.896-2.567,4.816-5.239,6.207-8.041c0.774-1.559,1.398-3.188,1.939-4.878h-7.702h-0.005v-0.015 c-5.384-0.001-10.269-2.193-13.799-5.723c-3.531-3.531-5.724-8.417-5.725-13.804H0v-0.002h0.014V19.542H0v-0.005h0.014 C0.015,14.263,2.126,9.466,5.541,5.952c0.062-0.073,0.127-0.145,0.196-0.214c3.531-3.531,8.417-5.724,13.804-5.725V0H19.542 L19.542,0z M105.57,28.056c-3.163,0-5.729,2.566-5.729,5.729s2.566,5.729,5.729,5.729c3.164,0,5.73-2.566,5.73-5.729 S108.734,28.056,105.57,28.056L105.57,28.056z"/></g>
                        </svg>
                    </div>
                </div>
            `
        },
        icon7: `
            <div class="cluaiz-box">
                <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 24 24" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                        <rect width="24" height="24" fill="none" />
                        <g fill="none">
                            <path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" />
                            <path fill="currentColor" d="M13 3a1 1 0 1 1 0 2H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3.697a2 2 0 0 1 1.11.336L12 18.798l2.193-1.462a2 2 0 0 1 1.11-.336H19a1 1 0 0 0 1-1v-4a1 1 0 1 1 2 0v4a3 3 0 0 1-3 3h-3.697l-2.61 1.74c-.42.28-.966.28-1.386 0L8.697 19H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm-4.5 7a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3m7 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3M20 1a1 1 0 0 1 .946.677l.13.378c.3.879.99 1.57 1.87 1.87l.377.129a1 1 0 0 1 0 1.892l-.378.13c-.879.3-1.57.99-1.87 1.87l-.129.377a1 1 0 0 1-1.892 0l-.13-.378a3 3 0 0 0-1.87-1.87l-.377-.129a1 1 0 0 1 0-1.892l.378-.13c.879-.3 1.57-.99 1.87-1.87l.129-.377l.062-.146A1 1 0 0 1 20 1m0 3.196a5 5 0 0 1-.804.804q.449.355.804.803q.356-.447.803-.803A5 5 0 0 1 20 4.196" />
                        </g>
                    </svg>
                </div>
            </div>
        `,
        icon8: `
            <div class="cluaiz-box">
                <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 24 24" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                        <path d="M7.76497 19.225C8.35411 18.9652 9.01479 18.9164 9.63316 19.0861C10.4032 19.2963 11.198 19.4019 12.001 19.4C16.5861 19.4 20.001 16.1135 20.001 11.7C20.001 7.28651 16.5861 4 12.001 4C7.41585 4 4.00098 7.28651 4.00098 11.7C4.00098 13.9699 4.89652 15.9722 6.46655 17.3764C7.0418 17.8853 7.38251 18.6082 7.409 19.3822L7.76497 19.225ZM12.001 2C17.6345 2 22.001 6.1265 22.001 11.7C22.001 17.2735 17.6345 21.4 12.001 21.4C11.0233 21.4023 10.0497 21.273 9.10648 21.0155C8.92907 20.9668 8.7403 20.9808 8.57198 21.055L6.58748 21.931C6.34398 22.0386 6.06291 22.018 5.83768 21.8761C5.61244 21.7342 5.47254 21.4896 5.46448 21.2235L5.40998 19.4445C5.40257 19.2257 5.30547 19.0196 5.14148 18.8745C3.19598 17.1345 2.00098 14.6155 2.00098 11.7C2.00098 6.1265 6.36748 2 12.001 2ZM5.99598 14.5365L8.93348 9.8765C9.15689 9.5221 9.51834 9.27728 9.93034 9.2013C10.3423 9.12532 10.7673 9.22511 11.1025 9.4765L13.439 11.2265C13.6528 11.3878 13.9476 11.3878 14.1615 11.2265L17.317 8.8315C17.738 8.512 18.288 9.016 18.006 9.4635L15.0685 14.1235C14.8451 14.4779 14.4836 14.7227 14.0716 14.7987C13.6596 14.8747 13.2346 14.7749 12.8995 14.5235L10.563 12.7735C10.3491 12.6122 10.0543 12.6122 9.84048 12.7735L6.68498 15.1685C6.26398 15.488 5.71398 14.984 5.99598 14.5365Z"></path>
                    </svg>
                </div>
            </div>
        `,
        sparkles: `
            <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background: var(--box-bg, linear-gradient(135deg, var(--gradient-color1), var(--gradient-color2))); border-radius:50%; box-shadow: var(--box-shadow, 0 8px 32px rgba(0,0,0,0.15)); border: var(--box-border, 1px solid rgba(255,255,255,0.15));">
                <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 123 119" class="cluaiz-icon-float" style="width:60%; height:60%; fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                        <path d="M57.49,29.2V23.53a14.41,14.41,0,0,1-2-.93A12.18,12.18,0,0,1,50.44,7.5a12.39,12.39,0,0,1,2.64-3.95A12.21,12.21,0,0,1,57,.92,12,12,0,0,1,61.66,0,12.14,12.14,0,0,1,72.88,7.5a12.14,12.14,0,0,1,0,9.27,12.08,12.08,0,0,1-2.64,3.94l-.06.06a12.74,12.74,0,0,1-2.36,1.83,11.26,11.26,0,0,1-2,.93V29.2H94.3a15.47,15.47,0,0,1,15.42,15.43v2.29H115a7.93,7.93,0,0,1,7.9,7.91V73.2A7.93,7.93,0,0,1,115,81.11h-5.25v2.07A15.48,15.48,0,0,1,94.3,98.61H55.23L31.81,118.72a2.58,2.58,0,0,1-3.65-.29,2.63,2.63,0,0,1-.63-1.85l1.25-18h-.21A15.45,15.45,0,0,1,13.16,83.18V81.11H7.91A7.93,7.93,0,0,1,0,73.2V54.83a7.93,7.93,0,0,1,7.9-7.91h5.26v-2.3A15.45,15.45,0,0,1,28.57,29.2H57.49ZM82.74,47.32a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm-42.58,0a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm6.38,31.36a2.28,2.28,0,0,1-.38-.38,2.18,2.18,0,0,1-.52-1.36,2.21,2.21,0,0,1,.46-1.39,2.4,2.4,0,0,1,.39-.39,3.22,3.22,0,0,1,3.88-.08A22.36,22.36,0,0,0,56,78.32a14.86,14.86,0,0,0,5.47,1A16.18,16.18,0,0,0,67,78.22,25.39,25.39,0,0,0,72.75,75a3.24,3.24,0,0,1,3.89.18,3,3,0,0,1,.37.41,2.22,2.22,0,0,1,.42,1.4,2.33,2.33,0,0,1-.58,1.35,2.29,2.29,0,0,1-.43.38,30.59,30.59,0,0,1-7.33,4,22.28,22.28,0,0,1-7.53,1.43A21.22,21.22,0,0,1,54,82.87a27.78,27.78,0,0,1-7.41-4.16l0,0ZM94.29,34.4H28.57A10.26,10.26,0,0,0,18.35,44.63V83.18A10.26,10.26,0,0,0,28.57,93.41h3.17a2.61,2.61,0,0,1,2.41,2.77l-1,14.58L52.45,94.15a2.56,2.56,0,0,1,1.83-.75h40a10.26,10.26,0,0,0,10.22-10.23V44.62A10.24,10.24,0,0,0,94.29,34.4Z"/>
                    </svg>
                </div>
            </div>
        `
    };


    // ai bot live icon
    const ANIMATED_BOT = `
        <div id="cluaiz-magnet-wrapper" style="width:100%; height:100%; will-change: transform;">
            <div class="bot-container-anim" id="bot-anim-wrapper">
                <div style="width:100%; height:100%; position:absolute;">
                    <svg class="cluaiz-layer" id="layer-body" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        <filter id="body-shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.15"/>
                        </filter>
                        <linearGradient id="head-gradient" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="var(--gradient-color1, var(--body-color))" />
                            <stop offset="100%" stop-color="var(--gradient-color2, #CBD5E1)" />
                        </linearGradient>
                        <rect x="12" y="22" width="76" height="64" rx="24" fill="url(#head-gradient)" filter="url(#body-shadow)" class="robot-body" id="robot-body-rect" />
                    </svg>
                    <svg class="cluaiz-layer" id="layer-face" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        <rect x="4" y="42" width="8" height="20" rx="4" fill="var(--ear-color, #0F172A)" />
                        <rect x="88" y="42" width="8" height="20" rx="4" fill="var(--ear-color, #0F172A)" />
                        <rect x="18" y="30" width="64" height="46" rx="18" fill="#0F172A" opacity="0.3" transform="translate(0, 2)" />
                        <rect x="18" y="30" width="64" height="46" rx="16" fill="#020617" />
                        <linearGradient id="reflection-grad" x1="50" y1="30" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="white" stop-opacity="0.08" />
                            <stop offset="100%" stop-color="white" stop-opacity="0" />
                        </linearGradient>
                        <rect x="18" y="30" width="64" height="26" rx="16" fill="url(#reflection-grad)" />
                    </svg>
                    <svg class="cluaiz-layer" id="layer-features" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        <defs>
                            <radialGradient id="iris-gradient" cx="50%" cy="50%" r="50%">
                                <stop offset="40%" stop-color="var(--eye-color)" />
                                <stop offset="100%" stop-color="#000" stop-opacity="0.3" />
                            </radialGradient>
                            <clipPath id="eye-mask-l"><ellipse cx="36" cy="48" rx="11" ry="13.5" /></clipPath>
                            <clipPath id="eye-mask-r"><ellipse cx="64" cy="48" rx="11" ry="13.5" /></clipPath>
                        </defs>
                        <g id="eye-group-l" class="cluaiz-eye-blink" style="transform-origin: 36px 48px; transition: transform 0.15s;">
                            <ellipse cx="36" cy="48" rx="11" ry="13.5" fill="#FFF" />
                            <g clip-path="url(#eye-mask-l)">
                                <g class="cluaiz-pupil">
                                    <circle cx="36" cy="48" r="7" fill="url(#iris-gradient)" />
                                    <circle cx="36" cy="48" r="3.5" fill="#000" />
                                    <ellipse cx="38" cy="44" rx="2.5" ry="1.5" fill="#FFF" opacity="0.9" transform="rotate(-45 38 44)" />
                                </g>
                            </g>
                        </g>
                        <g id="eye-group-r" class="cluaiz-eye-blink" style="transform-origin: 64px 48px; transition: transform 0.15s;">
                            <ellipse cx="64" cy="48" rx="11" ry="13.5" fill="#FFF" />
                            <g clip-path="url(#eye-mask-r)">
                                <g class="cluaiz-pupil">
                                    <circle cx="64" cy="48" r="7" fill="url(#iris-gradient)" />
                                    <circle cx="64" cy="48" r="3.5" fill="#000" />
                                    <ellipse cx="66" cy="44" rx="2.5" ry="1.5" fill="#FFF" opacity="0.9" transform="rotate(-45 66 44)" />
                                </g>
                            </g>
                        </g>
                        <circle cx="32" cy="62" r="6" fill="var(--cheek-color, #F472B6)" opacity="0.3" filter="blur(2px)" />
                        <circle cx="68" cy="62" r="6" fill="var(--cheek-color, #F472B6)" opacity="0.3" filter="blur(2px)" />
                        <rect x="28" y="32" width="14" height="3" rx="1.5" fill="var(--eyebrow-color, #F59E0B)" opacity="0.9" transform="rotate(-5 35 33.5)" />
                        <rect x="58" y="32" width="14" height="3" rx="1.5" fill="var(--eyebrow-color, #F59E0B)" opacity="0.9" transform="rotate(5 65 33.5)" />
                        <path id="bot-mouth" d="M42 66 Q 50 72 58 66" stroke="var(--lip-color, #F472B6)" stroke-width="2" stroke-linecap="round" opacity="0.8" />
                    </svg>
                </div>
            </div>
        </div>
    `;

    // ========================================
    // 📐 STYLES
    // ======================================== 
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes bot-blink {
            0%, 90%, 100% { transform: scaleY(1); }
            92% { transform: scaleY(0.1); }
            94% { transform: scaleY(1); }
            96% { transform: scaleY(0.1); }
            98% { transform: scaleY(1); }
        }
        .cluaiz-eye-blink { animation: bot-blink 5s infinite; }
        #cluaiz-launcher {
            position: fixed; bottom: 20px; right: 20px; overflow: visible;
            width: 100px; height: 100px; cursor: pointer; z-index: 2147483647;
            user-select: none; transform-origin: center center; transition: transform 0.3s ease;
            --body-color: #FFFFFF; --eye-color: #3B82F6; --lip-color: #F472B6;
            --primary-color: #3B82F6; --secondary-color: #8B5CF6;
            --anim-speed: 1.0; --anim-intensity: 1.0;
            --gradient-color1: #3B82F6; --gradient-color2: #8B5CF6; --gradient-angle: 45deg;
        }
        .cluaiz-box {
            width: 100%; height: 100%;
            position: relative; /* CRITICAL: Anchor point for ::before pseudo-elements (Orbit ring) */
            display: flex; align-items: center; justify-content: center;
            background: var(--box-bg, linear-gradient(135deg, var(--gradient-color1), var(--gradient-color2)));
            border-radius: var(--box-radius, 50%);
            box-shadow: var(--box-shadow, 0 8px 32px rgba(0,0,0,0.15));
            border: var(--box-border, 1px solid rgba(255,255,255,0.15));
        }
        /* #cluaiz-launcher:hover .bot-container-anim { animation: bot-bouncing 0.6s ease-in-out infinite; } REMOVED to allow manual control */
        
        .cluaiz-layer {
            position: absolute; top: 50%; left: 50%;
            transform: translate(calc(-50% + var(--offset-x, 0px)), calc(-50% + var(--offset-y, 0px)));
            transition: transform 0.1s ease-out; will-change: transform; pointer-events: none;
        }
        
        .cluaiz-pupil {
            transform: translate(var(--pupil-x, 0px), var(--pupil-y, 0px));
            transition: transform 0.1s cubic-bezier(0.25, 1.6, 0.5, 1); transform-origin: center;
        }

        .bot-container-anim { width: 100%; height: 100%; animation: bot-idle 4s ease-in-out infinite; }
        
        @keyframes bot-idle { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-3px) scale(1.02); } }
        @keyframes bot-bouncing { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-4px) scale(1.02); } }
        @keyframes bot-nod {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(8px) rotate(-5deg); }
        }
        
        /* ========================================
           🤖 ROBOT CHARACTER ANIMATIONS (Personality)
           ======================================== */
        
        /* Float - Zero-G floating in space */
        /* Float - Zero-G floating in space */
        @keyframes robot-float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(calc(-5px * var(--anim-intensity, 1))) rotate(calc(-1deg * var(--anim-intensity, 1))); }
            50% { transform: translateY(calc(-8px * var(--anim-intensity, 1))) rotate(0deg); }
            75% { transform: translateY(calc(-5px * var(--anim-intensity, 1))) rotate(calc(1deg * var(--anim-intensity, 1))); }
        }
        
        /* Wave - Friendly hello gesture */
        @keyframes robot-wave {
            0%, 100% { transform: rotate(0deg); }
            10%, 30% { transform: rotate(calc(-8deg * var(--anim-intensity, 1))); }
            20%, 40% { transform: rotate(calc(8deg * var(--anim-intensity, 1))); }
            50% { transform: rotate(0deg); }
        }
        
        /* Bounce - Hyper excited energy */
        @keyframes robot-bounce {
            0%, 100% { transform: translateY(0) scaleY(1); }
            10% { transform: translateY(0) scaleY(1.1) scaleX(0.9); }
            30% { transform: translateY(calc(-20px * var(--anim-intensity, 1))) scaleY(1.15) scaleX(0.95); }
            50% { transform: translateY(0) scaleY(0.9) scaleX(1.05); }
            57% { transform: translateY(calc(-7px * var(--anim-intensity, 1))) scaleY(1.05) scaleX(0.95); }
            64% { transform: translateY(0) scaleY(1); }
        }
        
        /* Peep - Curious head tilt */
        @keyframes robot-peep {
            0%, 100% { transform: rotate(0deg) translateX(0); }
            20% { transform: rotate(0deg) translateX(0); }
            25% { transform: rotate(calc(-15deg * var(--anim-intensity, 1))) translateX(calc(-5px * var(--anim-intensity, 1))); }
            35% { transform: rotate(calc(-15deg * var(--anim-intensity, 1))) translateX(calc(-5px * var(--anim-intensity, 1))); }
            40% { transform: rotate(0deg) translateX(0); }
        }
        
        /* Glitch - Cyberpunk hologram effect */
        @keyframes robot-glitch {
            0%, 100% { transform: translate(0, 0); filter: none; }
            10% { transform: translate(calc(-2px * var(--anim-intensity, 1)), calc(2px * var(--anim-intensity, 1))); filter: hue-rotate(90deg); }
            20% { transform: translate(calc(2px * var(--anim-intensity, 1)), calc(-2px * var(--anim-intensity, 1))); filter: hue-rotate(-90deg); }
            30% { transform: translate(0, 0); filter: none; }
        }

        /* Spin -> Happy Wiggle (Cute/Innocent) */
        @keyframes robot-spin {
            0%, 100% { transform: rotate(0deg) translateY(0); }
            25% { transform: rotate(calc(-12deg * var(--anim-intensity, 1))) translateY(calc(-4px * var(--anim-intensity, 1))); }
            75% { transform: rotate(calc(12deg * var(--anim-intensity, 1))) translateY(calc(-4px * var(--anim-intensity, 1))); }
        }
        
        /* ========================================
           ✨ SIMPLE ICON ANIMATIONS (Abstract Energy)
           ======================================== */
        
        /* ========================================
           ✨ SIMPLE ICON ANIMATIONS (Abstract Energy)
           ======================================== */
        
        /* 1. RIPPLE (Shockwave) */
        /* For Box: Expanding ring */
        @keyframes box-ripple {
            0% { box-shadow: 0 0 0 0 var(--secondary-color), 0 0 0 0 var(--primary-color); }
            40% { box-shadow: 0 0 0 calc(15px * var(--anim-intensity, 1)) rgba(255,255,255,0), 0 0 0 0 var(--primary-color); }
            80% { box-shadow: 0 0 0 calc(15px * var(--anim-intensity, 1)) rgba(255,255,255,0), 0 0 0 calc(30px * var(--anim-intensity, 1)) rgba(255,255,255,0); }
            100% { box-shadow: 0 0 0 0 rgba(255,255,255,0), 0 0 0 calc(30px * var(--anim-intensity, 1)) rgba(255,255,255,0); }
        }
        /* For Icon: Energy Pulse (Drop Shadow) */
        /* For Icon: Energy Pulse (Drop Shadow) -> UPDATED to be Ring Ripple if possible, or keep as Shadow Pulse */
        /* To make it look like "Expanding wave rings", we need a different approach or better shadow */
        @keyframes icon-ripple {
            0% { filter: drop-shadow(0 0 0 rgba(59,130,246,0.6)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 calc(10px * var(--anim-intensity, 1)) var(--primary-color)); transform: scale(1.05); }
            100% { filter: drop-shadow(0 0 0 rgba(59,130,246,0)); transform: scale(1.1); opacity: 0; }
        }
        /* Wait, fading out the ICON is bad. Let's make it a heartbeat ripple */
        @keyframes icon-ripple {
            0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(59,130,246,0.4)); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 15px var(--primary-color)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(59,130,246,0.4)); }
        }

        /* 2. GLOW (Radiance) - Fixed Visibility */
        @keyframes box-glow {
            0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 0 10px var(--primary-color, #3B82F6); }
            50% { box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 0 25px var(--primary-color, #3B82F6); }
        }
        /* For Icon: Stronger Neon Outline */
        @keyframes icon-glow {
            0%, 100% { 
                filter: drop-shadow(0 0 2px var(--primary-color, #3B82F6)) drop-shadow(0 0 4px var(--primary-color, #3B82F6)); 
                opacity: 1;
            }
            50% { 
                filter: drop-shadow(0 0 8px var(--primary-color, #3B82F6)) drop-shadow(0 0 16px var(--primary-color, #3B82F6)); 
                opacity: 1;
            }
        }
        
        /* Float - Gentle floating for icons */
        @keyframes icon-float {
            0%, 100% { transform: translateY(0px) scale(var(--icon-scale, 1)); }
            50% { transform: translateY(-4px) scale(var(--icon-scale, 1)); }
        }

        /* Pulse - Soft breathing (with Intensity) */
        @keyframes icon-pulse {
            0%, 100% { transform: scale(var(--icon-scale, 1)); filter: brightness(100%); }
            50% { transform: scale(calc(var(--icon-scale, 1) * 1.1)); filter: brightness(120%); }
        }
        
        /* 4. MORPH (Liquid Energy) */
        @keyframes box-morph {
            0%, 100% { border-radius: var(--box-radius, 50%); }
            25% { border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%; }
            50% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            75% { border-radius: 40% 60% 60% 40% / 30% 60% 40% 70%; }
        }
        @keyframes icon-morph {
            0%, 100% { transform: scale(var(--icon-scale, 1)) rotate(0deg); }
            33% { transform: scale(calc(var(--icon-scale, 1) * 1.05)) rotate(2deg); }
            66% { transform: scale(calc(var(--icon-scale, 1) * 0.95)) rotate(-2deg); }
        }
        
        /* 6. SHAKE (Alert) */
        @keyframes icon-shake {
            0%, 100% { transform: scale(var(--icon-scale, 1)) translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: scale(var(--icon-scale, 1)) translateX(-3px); }
            20%, 40%, 60%, 80% { transform: scale(var(--icon-scale, 1)) translateX(3px); }
        }
        
        /* 7. BOUNCE (Physical) */
        @keyframes icon-bounce {
            0%, 100% { transform: scale(var(--icon-scale, 1)) translateY(0); }
            50% { transform: scale(var(--icon-scale, 1)) translateY(calc(-10px * var(--anim-intensity, 1))); }
        }
        
        /* 8. SWING (Pendulum) */
        @keyframes icon-swing {
            20% { transform: rotate(15deg); }
            40% { transform: rotate(-10deg); }
            60% { transform: rotate(5deg); }
            80% { transform: rotate(-5deg); }
            0%, 100% { transform: rotate(0deg); }
        }
        
        /* 9. BEAT (Heartbeat) */
        @keyframes icon-beat {
            0%, 100% { transform: scale(var(--icon-scale, 1)); }
            14% { transform: scale(calc(var(--icon-scale, 1) * 1.3)); }
            28% { transform: scale(var(--icon-scale, 1)); }
            42% { transform: scale(calc(var(--icon-scale, 1) * 1.3)); }
            70% { transform: scale(var(--icon-scale, 1)); }
        }
        
        /* 10. TILT (3D) */
        @keyframes icon-tilt {
            0%, 100% { transform: perspective(100px) rotateX(0deg) rotateY(0deg); }
            25% { transform: perspective(100px) rotateX(5deg) rotateY(5deg); }
            50% { transform: perspective(100px) rotateX(-5deg) rotateY(5deg); }
            75% { transform: perspective(100px) rotateX(-5deg) rotateY(-5deg); }
        }
        
        /* Robot Animation Classes */
        .robot-float { animation: robot-float calc(4s / var(--anim-speed)) ease-in-out infinite; }
        .robot-wave { animation: robot-wave calc(3s / var(--anim-speed)) ease-in-out infinite; }
        .robot-bounce { animation: robot-bounce calc(1.5s / var(--anim-speed)) ease-in-out infinite; }
        .robot-peep { animation: robot-peep calc(5s / var(--anim-speed)) ease-in-out infinite; }
        .robot-glitch { animation: robot-glitch calc(3s / var(--anim-speed)) steps(1) infinite; }
        .robot-spin { animation: robot-spin calc(2s / var(--anim-speed)) ease-in-out infinite; }
        .bot-nod { animation: bot-nod 0.6s ease-in-out; }

        /* Helper for Icon Animations */
        .cluaiz-icon-animator {
            transform-origin: center center;
            will-change: transform;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .cluaiz-icon-float {
            transform-origin: center center;
            will-change: transform;
            transform: scale(var(--icon-scale, 1));
            transition: all 0.3s ease;
        }

        /* ========================================
           ✨ ANIMATION CLASS MAPPING (Decoupled)
           ======================================== */
        
        /* Box Animations (Styles the container) */
        .box-anim-ripple .cluaiz-box { animation: box-ripple calc(4s / var(--anim-speed)) cubic-bezier(0, 0, 0.2, 1) infinite; }
        .box-anim-pulse .cluaiz-box { animation: icon-pulse calc(4s / var(--anim-speed)) ease-in-out infinite; }
        .box-anim-morph .cluaiz-box { animation: box-morph calc(10s / var(--anim-speed)) ease-in-out infinite; }
        .box-anim-glow .cluaiz-box { animation: box-glow calc(5s / var(--anim-speed)) ease-in-out infinite; }
        .box-anim-shake .cluaiz-box { animation: icon-shake calc(4s / var(--anim-speed)) ease-in-out infinite; }
        .box-anim-bounce .cluaiz-box { animation: icon-bounce calc(2s / var(--anim-speed)) ease-in-out infinite; }
        .box-anim-swing .cluaiz-box { animation: icon-swing calc(4s / var(--anim-speed)) ease-in-out infinite; }
        .box-anim-beat .cluaiz-box { animation: icon-beat calc(3s / var(--anim-speed)) ease-in-out infinite; }
        .box-anim-tilt .cluaiz-box { animation: icon-tilt calc(6s / var(--anim-speed)) ease-in-out infinite; }
        
        /* Icon Animations (Styles the SVG Wrapper) - Decoupled from Sizing */
        .icon-anim-float .cluaiz-icon-animator { animation: icon-float 3s ease-in-out infinite; }
        .icon-anim-ripple .cluaiz-icon-animator { animation: icon-ripple calc(2s / var(--anim-speed)) ease-out infinite; }
        .icon-anim-pulse .cluaiz-icon-animator { animation: icon-pulse calc(1.5s / var(--anim-speed)) ease-in-out infinite; }
        .icon-anim-morph .cluaiz-icon-animator { animation: icon-morph calc(3s / var(--anim-speed)) ease-in-out infinite; }
        .icon-anim-shake .cluaiz-icon-animator { animation: icon-shake calc(2s / var(--anim-speed)) ease-in-out infinite; }
        .icon-anim-bounce .cluaiz-icon-animator { animation: icon-bounce calc(0.8s / var(--anim-speed)) ease-in-out infinite; }
        .icon-anim-swing .cluaiz-icon-animator { animation: icon-swing calc(2s / var(--anim-speed)) ease-in-out infinite; }
        .icon-anim-beat .cluaiz-icon-animator { animation: icon-beat calc(1.5s / var(--anim-speed)) ease-in-out infinite; }
        .icon-anim-glow .cluaiz-icon-animator { animation: icon-glow calc(2s / var(--anim-speed)) ease-in-out infinite; } 
        .icon-anim-tilt .cluaiz-icon-animator { animation: icon-tilt calc(3s / var(--anim-speed)) ease-in-out infinite; }
        
        /* ========================================
           🎮 MICRO-INTERACTIONS (Premium Feel)
           ======================================== */
        
        /* Hover State - Anticipation */
        #cluaiz-launcher.is-hovered {
            transform: scale(1.05); /* Restored default "fine" behavior */
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* Specific overrides for stronger effects */
        #cluaiz-launcher.hover-effect-scale.is-hovered {
            transform: scale(1.15); /* Stronger scale for explicit 'Scale' option */
        }
        #cluaiz-launcher.hover-effect-tilt.is-hovered {
            transform: rotate(15deg) scale(1.1);
        }
        
        /* Removed default hover glow as requested */
        #cluaiz-launcher.is-hovered .cluaiz-box {
            /* No default shadow change */
        }
        
        /* Click State - Tactile Feedback */
        #cluaiz-launcher.is-active {
            transform: scale(0.95);
            transition: transform 0.1s ease-out;
        }
        
        /* Notification State - Attention */
        #cluaiz-launcher.has-notification {
            animation: attention-pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes attention-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* Notification Badge */
        .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            background: #EF4444;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.6);
            animation: badge-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            z-index: 10;
        }
        
        @keyframes badge-pop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
        }

        /* Icon Animation Keyframes */
        @keyframes icon-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        @keyframes icon-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-5px) rotate(-5deg); }
            40% { transform: translateX(5px) rotate(5deg); }
            60% { transform: translateX(-5px) rotate(-5deg); }
            80% { transform: translateX(5px) rotate(5deg); }
        }
        @keyframes icon-flip {
            0% { transform: rotateY(0); }
            100% { transform: rotateY(360deg); }
        }

        /* Robot Interaction Animations */
        @keyframes robot-wave {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(-15deg); }
            40% { transform: rotate(10deg); }
            60% { transform: rotate(-15deg); }
            80% { transform: rotate(5deg); }
        }
        @keyframes robot-peep {
            0% { transform: scale(1) translateY(0); }
            40% { transform: scale(1.15) translateY(-8px); }
            50% { transform: scale(1.15) translateY(-8px); }
            100% { transform: scale(1) translateY(0); }
        }
        @keyframes robot-spin {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-8deg); }
            75% { transform: rotate(8deg); }
        }
        
        /* Removed conflicting non-looping classes. Personality classes (lines 447-452) handle infinite loops. Hover uses inline styles. */
        

        
        /* ========================================
           🎬 ENTRANCE ANIMATIONS
           ======================================== */
        
        @keyframes entrance-popup {
            0% { transform: translateY(100px) scale(0); opacity: 0; }
            60% { transform: translateY(-10px) scale(1.1); }
            80% { transform: translateY(5px) scale(0.95); }
            100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        @keyframes entrance-slide {
            0% { transform: translateX(100px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes entrance-fade {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        

        @keyframes entrance-zoom {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes entrance-rotate {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes entrance-elastic {
            0% { transform: translateY(100px) scale(0.5); opacity: 0; }
            40% { transform: translateY(-20px) scale(1.1); }
            60% { transform: translateY(10px) scale(0.95); }
            80% { transform: translateY(-5px) scale(1.05); }
            100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        .entrance-popup { animation: entrance-popup 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .entrance-slide { animation: entrance-slide 0.5s ease-out; }
        .entrance-fade { animation: entrance-fade 0.8s ease-in; }
        .entrance-zoom { animation: entrance-zoom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .entrance-rotate { animation: entrance-rotate 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .entrance-elastic { animation: entrance-elastic 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        
        /* Gradient Animation */
        /* Gradient Animation - Pulse instead of Color Cycle */
        @keyframes gradient-pulse {
            0% { filter: brightness(1); }
            50% { filter: brightness(1.1) saturate(1.2); }
            100% { filter: brightness(1); }
        }
        .gradient-animated .robot-body {
            animation: gradient-pulse 2s ease-in-out infinite;
        }

        #cluaiz-iframe {
            position: fixed; 
            /* Position is set dynamically via inline styles based on launcher config */
            width: 380px; height: 600px;
            border: none; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
            z-index: 2147483646;
            opacity: 0; pointer-events: none; transform: translateY(20px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #cluaiz-iframe.cluaiz-visible { opacity: 1; pointer-events: all; transform: translateY(0) scale(1); }
        
        @media (max-width: 480px) {
            #cluaiz-iframe { 
                width: 92%; 
                height: 75%; 
                /* Position is set dynamically via JS - no hardcoded right/bottom */
            }
            #cluaiz-launcher { 
                width: 80px; 
                height: 80px; 
                /* Position is set dynamically via JS based on config.position */
            }
        }


        /* Analytics Badge */
        #cluaiz-analytics-badge {
            position: fixed; bottom: 20px; right: 130px;
            height: 40px; padding: 0 16px; border-radius: 20px;
            background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: flex; align-items: center; gap: 8px;
            cursor: pointer; z-index: 2147483647;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px; font-weight: 600; color: #0F172A;
            opacity: 0; transform: translateY(10px); pointer-events: none;
            transition: all 0.3s ease;
        }
        #cluaiz-analytics-badge.visible { opacity: 1; transform: translateY(0); pointer-events: all; }
        #cluaiz-analytics-badge:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
        
        #cluaiz-analytics-iframe {
            position: fixed; bottom: 80px; right: 130px; width: 320px; height: 450px;
            border: none; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
            z-index: 2147483648;
            opacity: 0; pointer-events: none; transform: translateY(10px) scale(0.95);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #cluaiz-analytics-iframe.visible { opacity: 1; pointer-events: all; transform: translateY(0) scale(1); }
    `;
    document.head.appendChild(style);

    // ========================================
    // 🚀 LAUNCHER CREATION
    // ========================================
    const launcher = document.createElement('div');
    launcher.id = 'cluaiz-launcher';
    launcher.innerHTML = ANIMATED_BOT; // Default: Animated bot
    document.body.appendChild(launcher);

    // Get animation elements (for animated bot)
    let layerBody = document.getElementById('layer-body');
    let layerFace = document.getElementById('layer-face');
    let layerFeatures = document.getElementById('layer-features');
    let eyeLeft = document.getElementById('eye-group-l');
    let eyeRight = document.getElementById('eye-group-r');
    let botAnim = document.getElementById('bot-anim-wrapper');

    // Mouse tracking for animated bot
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2, rafId = null;

    function initMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX; mouseY = e.clientY;
            if (!rafId) rafId = requestAnimationFrame(updateAnimation);
        }, { passive: true });
    }

    function updateAnimation() {
        rafId = null;
        if (!layerBody || !launcher) return;

        // 1. Stable Anchor (Outer fixed div)
        const rect = launcher.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
        const dx = mouseX - centerX, dy = mouseY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // --- 🧲 MAGNET EFFECT (Applied to Inner Child) ---
        const animTarget = launcher.children[0];

        if (animTarget) {
            const MAGNET_PADDING = 150; // Wide range ("ak ario")
            const MAGNET_STRENGTH = 3; // Strong pull ("chipak jaye")
            const isActive = dist < (rect.width / 2 + MAGNET_PADDING);
            const isHovered = dist < (rect.width / 2);

            if (isActive) {
                // Computed pull
                const tx = dx / MAGNET_STRENGTH;
                const ty = dy / MAGNET_STRENGTH;
                const scale = isHovered ? 1.15 : 1.0;

                // Dynamic Transition: Fast when seeking, Elastic when following
                animTarget.style.transition = 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)';
                animTarget.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
            } else {
                // Release: Elastic Bounce Back
                animTarget.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                animTarget.style.transform = `translate3d(0, 0, 0) scale(1)`;
            }
        }

        // --- BOT EYES (Existing Logic - Uses Anchor) ---
        const maxDist = 500, influence = Math.min(dist / maxDist, 1);
        const dirX = dx / (dist || 1), dirY = dy / (dist || 1);

        setOffset(layerBody, dirX, dirY, influence, 4);
        setOffset(layerFace, dirX, dirY, influence, 8);
        setOffset(layerFeatures, dirX, dirY, influence, 12);

        const pupilOffset = 6 * influence;
        launcher.style.setProperty('--pupil-x', `${dirX * pupilOffset}px`);
        launcher.style.setProperty('--pupil-y', `${dirY * pupilOffset}px`);
    }

    function setOffset(el, dirX, dirY, influence, max) {
        if (!el) return;
        const x = dirX * max * influence, y = dirY * max * influence;
        el.style.setProperty('--offset-x', `${x}px`);
        el.style.setProperty('--offset-y', `${y}px`);
    }

    function blink() {
        if (!eyeLeft || !eyeRight) return;
        eyeLeft.style.transform = 'scaleY(0.1)';
        eyeRight.style.transform = 'scaleY(0.1)';
        setTimeout(() => {
            if (eyeLeft) eyeLeft.style.transform = 'scaleY(1)';
            if (eyeRight) eyeRight.style.transform = 'scaleY(1)';
        }, 150);
        setTimeout(blink, Math.random() * 4000 + 2000);
    }

    // Initialize mouse tracking and blinking for default bot
    initMouseTracking();
    setTimeout(blink, 2000);

    // Helper to trigger temporary animations (Interaction/Reaction)
    function triggerAnimation(el, animClass, duration) {
        if (!el) return;
        // remove first to reset if already playing
        el.classList.remove(animClass);
        void el.offsetWidth; // force reflow
        el.classList.add(animClass);
        setTimeout(() => {
            el.classList.remove(animClass);
        }, duration);
    }

    // Track current config globally within IIFE to avoid stale closures in event listeners
    let currentConfig = null;

    // ========================================
    // 🎨 CUSTOMIZATION SYSTEM
    // ========================================
    function applyCustomization(configOverride) {
        try {
            // Hoist config variable
            var config;

            if (configOverride) {
                config = configOverride;
            } else {
                const configStr = localStorage.getItem('cluaiz-widget-config');
                if (!configStr) {
                    console.log('📝 Cluaiz: No config found, using default animated bot');
                    return;
                }
                config = JSON.parse(configStr);
            }

            // Sync global config for listeners
            currentConfig = config;
            // console.log('🔄 Cluaiz: Current config updated', currentConfig);

            currentConfig = config; // Update global reference

            console.log('🎨 Cluaiz: Applying customization', config);

            // Apply colors
            if (config.theme?.primaryColor) {
                launcher.style.setProperty('--primary-color', config.theme.primaryColor);
                launcher.style.setProperty('--eye-color', config.theme.primaryColor);
            }
            if (config.theme?.secondaryColor) {
                launcher.style.setProperty('--secondary-color', config.theme.secondaryColor);
            }

            // Apply robot-specific colors
            if (config.robot?.eyeColor) launcher.style.setProperty('--eye-color', config.robot.eyeColor);
            if (config.robot?.cheekColor) launcher.style.setProperty('--cheek-color', config.robot.cheekColor);
            if (config.robot?.lipColor) launcher.style.setProperty('--lip-color', config.robot.lipColor);
            if (config.robot?.earColor) launcher.style.setProperty('--ear-color', config.robot.earColor);
            if (config.robot?.eyebrowColor) launcher.style.setProperty('--eyebrow-color', config.robot.eyebrowColor);
            if (config.robot?.bodyColor) {
                launcher.style.setProperty('--body-color', config.robot.bodyColor);
                console.log(`🎨 Cluaiz: Body color set to ${config.robot.bodyColor}`);
            }

            // Apply Gradient System
            if (config.robot?.useGradient) {
                launcher.style.setProperty('--gradient-color1', config.robot.gradientColor1 || '#3B82F6');
                launcher.style.setProperty('--gradient-color2', config.robot.gradientColor2 || '#8B5CF6');
                launcher.style.setProperty('--gradient-angle', (config.robot.gradientAngle || 45) + 'deg');
                console.log(`🎨 Cluaiz: Gradient enabled (${config.robot.gradientType}) - ${config.robot.gradientColor1} → ${config.robot.gradientColor2}`);

                // Apply gradient animation
                if (config.robot?.animateGradient) {
                    launcher.classList.add('gradient-animated');
                    console.log('🔄 Cluaiz: Gradient animation ON');
                } else {
                    launcher.classList.remove('gradient-animated');
                }
            } else {
                // Reset to flat color
                launcher.style.setProperty('--gradient-color1', config.robot?.bodyColor || '#FFFFFF');
                launcher.style.setProperty('--gradient-color2', config.robot?.bodyColor || '#FFFFFF');
            }

            // Override gradient for Simple Icons using Theme Colors
            if (config.icon?.type && config.icon.type !== 'robot') {
                if (config.theme?.primaryColor) {
                    launcher.style.setProperty('--gradient-color1', config.theme.primaryColor);
                    launcher.style.setProperty('--primary-color', config.theme.primaryColor); // For Glow/Orbit
                }
                if (config.theme?.secondaryColor) launcher.style.setProperty('--gradient-color2', config.theme.secondaryColor);
                if (config.theme?.iconColor) launcher.style.setProperty('--icon-color', config.theme.iconColor);

                // Icon Style (Outline vs Solid)
                const isOutline = config.theme?.iconStyle === 'outline';
                launcher.style.setProperty('--icon-fill', isOutline ? 'none' : (config.theme?.iconColor || 'white'));
                launcher.style.setProperty('--icon-stroke', isOutline ? (config.theme?.iconColor || 'white') : 'none');
                launcher.style.setProperty('--icon-stroke-width', isOutline ? '2px' : '0px');

                // Box Visibility
                if (config.theme?.showBox === false) {
                    launcher.style.setProperty('--box-bg', 'transparent');
                    launcher.style.setProperty('--box-shadow', 'none');
                    launcher.style.setProperty('--box-border', 'none');
                } else {
                    launcher.style.removeProperty('--box-bg');
                    launcher.style.removeProperty('--box-shadow');
                    launcher.style.removeProperty('--box-border');
                }

                // Box Radius & Icon Scale
                if (config.theme?.boxRadius !== undefined) {
                    launcher.style.setProperty('--box-radius', `${config.theme.boxRadius}%`);
                }
                if (config.theme?.iconScale !== undefined) {
                    launcher.style.setProperty('--icon-scale', config.theme.iconScale);
                }
            }

            // Apply icon type
            let iconType = config.icon?.type || 'robot';
            if (iconType === 'robot') {
                // Use animated bot
                launcher.innerHTML = ANIMATED_BOT;
                launcher.style.width = '100px';
                launcher.style.height = '100px';

                // Re-get elements
                layerBody = document.getElementById('layer-body');
                layerFace = document.getElementById('layer-face');
                layerFeatures = document.getElementById('layer-features');
                eyeLeft = document.getElementById('eye-group-l');
                eyeRight = document.getElementById('eye-group-r');
                botAnim = document.getElementById('bot-anim-wrapper');

                // Apply gradient angle if gradient is enabled
                if (config.robot?.useGradient && config.robot?.gradientAngle !== undefined) {
                    const angle = config.robot.gradientAngle;
                    const radians = (angle - 90) * (Math.PI / 180);
                    const x1 = 50 + 40 * Math.cos(radians);
                    const y1 = 50 + 40 * Math.sin(radians);
                    const x2 = 50 - 40 * Math.cos(radians);
                    const y2 = 50 - 40 * Math.sin(radians);

                    const gradient = document.getElementById('head-gradient');
                    if (gradient) {
                        gradient.setAttribute('x1', x1 + '%');
                        gradient.setAttribute('y1', y1 + '%');
                        gradient.setAttribute('x2', x2 + '%');
                        gradient.setAttribute('y2', y2 + '%');
                        console.log(`🎨 Cluaiz: Gradient angle set to ${angle}° (${x1.toFixed(1)}, ${y1.toFixed(1)} → ${x2.toFixed(1)}, ${y2.toFixed(1)})`);
                    }
                }

                // Restart blinking
                setTimeout(blink, 2000);
                console.log('🤖 Cluaiz: Animated bot loaded');
            } else if (SIMPLE_ICONS[iconType]) {
                // Use simple icon (support both String and Object types)
                const iconDef = SIMPLE_ICONS[iconType];
                const iconStyle = config.theme?.iconStyle || 'solid'; // 'solid' or 'outline'

                if (typeof iconDef === 'string') {
                    launcher.innerHTML = iconDef;
                } else if (typeof iconDef === 'object') {
                    // Try to get specific style, fallback to solid, then outline
                    launcher.innerHTML = iconDef[iconStyle] || iconDef.solid || iconDef.outline;
                }

                // Clear bot elements
                layerBody = layerFace = layerFeatures = eyeLeft = eyeRight = botAnim = null;

                console.log(`🎭 Cluaiz: Simple icon loaded (${iconType}) - Style: ${iconStyle}`);
            } else {
                console.warn(`⚠️ Cluaiz: Unknown icon type "${iconType}", falling back to Robot.`);
                // Fallback to robot if unknown type
                launcher.innerHTML = ANIMATED_BOT;
                launcher.style.width = '100px';
                launcher.style.height = '100px';
                // Re-get elements (duplicate logic from above, but safer)
                layerBody = document.getElementById('layer-body');
                layerFace = document.getElementById('layer-face');
                layerFeatures = document.getElementById('layer-features');
                eyeLeft = document.getElementById('eye-group-l');
                eyeRight = document.getElementById('eye-group-r');
                botAnim = document.getElementById('bot-anim-wrapper');
                setTimeout(blink, 2000);
            }

            // Apply size
            if (config.icon?.size) {
                const sizes = {
                    xs: '60px',
                    sm: '75px',
                    md: '90px',
                    lg: '105px',
                    xl: '120px'
                };
                const size = sizes[config.icon.size] || '90px';
                launcher.style.width = size;
                launcher.style.height = size;
                console.log(`📏 Cluaiz: Size set to ${config.icon.size.toUpperCase()} (${size})`);
            }


            // Apply Motion Matrix Animations
            // ========================================
            // ✨ DECOUPLED ANIMATION SYSTEM
            // ========================================

            // Clear all existing animation classes
            const allAnims = ['icon-ripple', 'icon-pulse', 'icon-glow', 'icon-morph', 'icon-orbit', 'icon-shake', 'icon-bounce', 'icon-swing', 'icon-beat', 'icon-tilt'];
            // Also clear new namespaced classes
            // ========================================
            // ✨ DECOUPLED ANIMATION SYSTEM
            // ========================================

            // Apply icon type
            // Apply icon type (ensure variable is used from upper scope)
            iconType = config.icon?.type || 'robot';

            // 1. CLEAR ALL ANIMATIONS INSTANTLY
            launcher.classList.remove(
                'robot-float', 'robot-wave', 'robot-bounce', 'robot-peep', 'robot-glitch', 'robot-spin',
                'icon-anim-ripple', 'icon-anim-pulse', 'icon-anim-morph', 'icon-anim-shake', 'icon-anim-glow', 'icon-anim-bounce', 'icon-anim-swing', 'icon-anim-beat', 'icon-anim-tilt',
                'box-anim-ripple', 'box-anim-pulse', 'box-anim-morph', 'box-anim-glow', 'box-anim-shake', 'box-anim-bounce', 'box-anim-swing', 'box-anim-beat', 'box-anim-tilt',
                'entrance-popup', 'entrance-slide', 'entrance-fade', 'entrance-zoom', 'entrance-rotate', 'entrance-elastic'
            );

            // 2. UPDATE DOM & VARIABLES (Synchronous)
            // Note: DOM is already updated above in the initial rendering block. 
            // We just need to ensure overflow is visible for ripples if it's an icon.
            if (iconType !== 'robot') {
                const box = launcher.querySelector('.cluaiz-box');
                if (box) box.style.overflow = 'visible';
            }

            // Animation Speed & Intensity
            if (config.animation?.speed) launcher.style.setProperty('--anim-speed', config.animation.speed);
            if (config.animation?.intensity) launcher.style.setProperty('--anim-intensity', config.animation.intensity);
            if (config.theme?.boxRadius) launcher.style.setProperty('--box-radius', `${config.theme.boxRadius}%`);


            // 3. APPLY NEW ANIMATIONS (Next Frame - Forces Restart)
            setTimeout(() => {
                if (iconType === 'robot') {
                    if (config.animation?.robot && config.animation.robot !== 'none') {
                        launcher.classList.add(`robot-${config.animation.robot}`);
                    }
                } else {
                    if (config.animation?.simple && config.animation.simple !== 'none') {
                        launcher.classList.add(`icon-anim-${config.animation.simple}`);
                    }
                }

                if (config.theme?.boxAnimation && config.theme?.boxAnimation !== 'none') {
                    launcher.classList.add(`box-anim-${config.theme.boxAnimation}`);
                }

                if (config.animation?.entrance && config.animation.entrance !== 'none') {
                    launcher.classList.add(`entrance-${config.animation.entrance}`);
                    // REMOVE after animation to prevent replay on hover/reflow
                    setTimeout(() => {
                        launcher.classList.remove(`entrance-${config.animation.entrance}`);
                    }, 1500);
                }

                console.log('✨ Cluaiz: Animations applied');
            }, 10); // Small delay to force reflow

            // Apply position
            if (config.position) {
                launcher.style.left = '';
                launcher.style.right = '';
                launcher.style.top = '';
                launcher.style.bottom = '';

                const offsetX = config.position.offsetX || 20;
                const offsetY = config.position.offsetY || 20;

                if (config.position.horizontal === 'left') {
                    launcher.style.left = `${offsetX}px`;
                } else {
                    launcher.style.right = `${offsetX}px`;
                }

                if (config.position.vertical === 'top') {
                    launcher.style.top = `${offsetY}px`;
                } else {
                    launcher.style.bottom = `${offsetY}px`;
                }

                console.log(`📍 Cluaiz: Position set to ${config.position.vertical}-${config.position.horizontal}`);


                // ========================================
                // 🖱️ INTERACTION LISTENERS (Hover & Click)
                // ========================================

                // 2. HOVER INTERACTIONS
                launcher.addEventListener('mouseenter', () => {
                    if (!currentConfig) return;
                    console.log('👆 Cluaiz: Hover');

                    // Robot Hover
                    if (currentConfig.icon?.type === 'robot') {
                        const action = currentConfig.behavior?.robot?.hover || 'none';
                        const wrapper = document.getElementById('bot-anim-wrapper');

                        if (action !== 'none') {
                            launcher.classList.add('is-hovered');

                            if (wrapper) {
                                // Explicitly force animation via inline style to bypass any caching/specificity issues
                                const anims = {
                                    'wave': 'robot-wave 1s ease-in-out',
                                    'surprise': 'robot-peep 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    'giggle': 'robot-spin 0.8s linear'
                                };

                                if (anims[action]) {
                                    wrapper.style.animation = 'none';
                                    void wrapper.offsetWidth; // Reflow
                                    wrapper.style.animation = anims[action];

                                    // Reset after duration
                                    setTimeout(() => {
                                        if (wrapper.style.animationName === anims[action].split(' ')[0]) {
                                            wrapper.style.animation = ''; // Reset to allow idle
                                        }
                                    }, 1000);
                                }
                            }
                        }
                    }
                    // Icon Hover
                    else {
                        const action = currentConfig.behavior?.icon?.hover || 'none';
                        launcher.style.filter = ''; // Reset

                        // Remove old classes first to be safe
                        launcher.classList.remove('hover-effect-scale', 'hover-effect-tilt');

                        if (action !== 'none') {
                            launcher.classList.add('is-hovered');

                            if (action === 'scale') {
                                launcher.classList.add('hover-effect-scale');
                            } else if (action === 'tilt') {
                                launcher.classList.add('hover-effect-tilt');
                            } else if (action === 'bounce') {
                                launcher.style.animation = 'icon-bounce 0.6s ease-in-out infinite';
                            } else if (action === 'pulse') {
                                launcher.style.animation = 'icon-pulse 1.5s ease-in-out infinite';
                            }
                        }
                    }
                });

                launcher.addEventListener('mouseleave', () => {
                    if (!currentConfig) return;
                    launcher.classList.remove('is-hovered');
                    launcher.style.filter = '';

                    if (currentConfig.behavior?.icon?.hover === 'scale' || currentConfig.behavior?.icon?.hover === 'tilt') {
                        launcher.style.transform = 'scale(1) rotate(0deg)';
                    }

                    // Reset Animations if it was a hover-only animation
                    // (But don't kill Entrance/Energy animations if they are persistent... wait. 
                    // Hover animations override style.animation. We need to be careful not to kill persistent ones.)
                    // Actually, modifying style.animation directly overwrites classes.
                    // This is why switching to classes for hover would be better, but the existing code used inline styles.
                    // Let's stick to inline restoration:
                    launcher.style.animation = '';

                    // If we had an Energy Style (class-based), clearing style.animation is fine because classes have lower specificity? 
                    // No, inline style overrides classes. So clearing inline style restores the class-based animation!

                    const wrapper = document.getElementById('bot-anim-wrapper');
                    if (wrapper) wrapper.style.animation = ''; // Reset wrapper override
                });

                // 3. CLICK INTERACTIONS
                launcher.addEventListener('mousedown', () => {
                    if (!currentConfig) return;

                    const isRobot = currentConfig.icon?.type === 'robot';
                    const clickAction = isRobot ? (currentConfig.behavior?.robot?.click || 'nod') : (currentConfig.behavior?.icon?.click || 'none');

                    if (clickAction !== 'none') launcher.classList.add('is-active');

                    if (isRobot) {
                        const wrapper = document.getElementById('bot-anim-wrapper');
                        if (clickAction === 'jump') triggerAnimation(wrapper, 'robot-bounce', 500);
                        else if (clickAction === 'nod') {
                            const body = launcher.querySelector('.robot-body');
                            if (body) triggerAnimation(body, 'bot-nod', 600);
                        }
                    } else {
                        if (clickAction === 'ripple-burst') {
                            // Create ripple
                            const ripple = document.createElement('div');
                            ripple.className = 'cluaiz-ripple';
                            Object.assign(ripple.style, {
                                position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%',
                                borderRadius: '50%', border: '3px solid rgba(255,255,255,0.9)',
                                transform: 'translate(-50%, -50%) scale(0.4)', opacity: '1', pointerEvents: 'none',
                                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 0 20px rgba(255,255,255,0.5)'
                            });
                            launcher.appendChild(ripple);
                            requestAnimationFrame(() => {
                                ripple.style.transform = 'translate(-50%, -50%) scale(2.8)';
                                ripple.style.opacity = '0';
                                ripple.style.borderWidth = '0px';
                            });
                            setTimeout(() => ripple.remove(), 600);
                        }
                    }
                });

                launcher.addEventListener('mouseup', () => launcher.classList.remove('is-active'));
                launcher.addEventListener('mouseleave', () => launcher.classList.remove('is-active'));



                console.log('✅ Cluaiz: Customization applied successfully');


                // ========================================
                // 🎮 ADVANCED BEHAVIOR SYSTEM (Deep Customization)
                // ========================================

                // Remove existing specific listeners if we track them, but for now let's use a flag on the launcher
                if (!launcher.dataset.hasBehaviorListeners) {
                    launcher.dataset.hasBehaviorListeners = 'true';

                    // State Tracking
                    // let isHovered = false; // logic internal
                    // let isClicked = false; // logic internal
                    // mouseX, mouseY are global

                    // 1. MOUSE MOVE TRACKING (Global)
                    document.addEventListener('mousemove', (e) => {
                        if (!currentConfig) return; // Safety

                        mouseX = e.clientX; mouseY = e.clientY;
                    });

                    // Helper for one-shot animations (restarts if already playing)
                    function triggerAnimation(element, animation, duration = 1000) {
                        if (!element) return;

                        // Reset
                        element.style.animation = 'none';
                        void element.offsetWidth; // Force Reflow

                        // Play
                        element.style.animation = `${animation} ${duration}ms ease-in-out`;

                        // Cleanup after finish to restore loop (e.g., float)
                        setTimeout(() => {
                            element.style.animation = '';
                        }, duration);
                    }


                    // 2. HOVER INTERACTIONS


                    // 3. CLICK INTERACTIONS
                    launcher.addEventListener('mousedown', () => {
                        if (!currentConfig) return;

                        // Determine if we should apply the is-active class (scale effect)
                        // Only add it if click behavior is not 'none'
                        const isRobot = currentConfig.icon?.type === 'robot';
                        const clickAction = isRobot
                            ? (currentConfig.behavior?.robot?.click || 'nod')
                            : (currentConfig.behavior?.icon?.click || 'none');

                        // Only add is-active class if click behavior is not 'none'
                        if (clickAction !== 'none') {
                            launcher.classList.add('is-active');
                        }

                        // Robot Click
                        if (isRobot) {
                            const action = clickAction;
                            const wrapper = document.getElementById('bot-anim-wrapper');

                            if (action === 'none') {
                                // No click effect
                            } else if (action === 'jump') {
                                triggerAnimation(wrapper, 'robot-bounce', 500);
                            } else if (action === 'wink') {
                                const eyes = launcher.querySelectorAll('.cluaiz-eye-blink');
                                if (eyes.length >= 2) {
                                    // Reset BOTH to keep sync
                                    eyes.forEach(eye => eye.style.animation = 'none');

                                    // Wink Right Eye
                                    eyes[1].style.transform = 'scaleY(0.1)';

                                    setTimeout(() => {
                                        eyes[1].style.transform = 'scaleY(1)';
                                        // Restore loop for BOTH safely
                                        setTimeout(() => {
                                            eyes.forEach(eye => eye.style.animation = '');
                                        }, 1000);
                                    }, 300);
                                }
                            } else if (action === 'close-eyes') {
                                // Close both eyes
                                const eyes = launcher.querySelectorAll('.cluaiz-eye-blink');
                                eyes.forEach(eye => {
                                    eye.style.animation = 'none';
                                    eye.style.transform = 'scaleY(0.1)';
                                });
                                setTimeout(() => {
                                    eyes.forEach(eye => {
                                        eye.style.transform = 'scaleY(1)';
                                    });
                                    // Restore loop safely
                                    setTimeout(() => {
                                        eyes.forEach(eye => eye.style.animation = '');
                                    }, 1000);
                                }, 400);
                            } else if (action === 'nod') {
                                // Apply nod to the body layer to avoid conflict with wrapper idle anim
                                const body = launcher.querySelector('.robot-body');
                                if (body) triggerAnimation(body, 'bot-nod', 600);
                            }
                        }
                        // Icon Click
                        else {
                            const action = currentConfig.behavior?.icon?.click || 'none';
                            if (action === 'none') {
                                // No click effect
                            } else if (action === 'ripple-burst') {
                                const ripple = document.createElement('div');
                                ripple.className = 'cluaiz-ripple';
                                Object.assign(ripple.style, {
                                    position: 'absolute',
                                    top: '50%', left: '50%',
                                    width: '100%', height: '100%',
                                    borderRadius: '50%',
                                    border: '3px solid rgba(255,255,255,0.9)', // Thicker, brighter
                                    transform: 'translate(-50%, -50%) scale(0.4)',
                                    opacity: '1',
                                    pointerEvents: 'none',
                                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: '0 0 20px rgba(255,255,255,0.5)' // Add glow
                                });
                                launcher.appendChild(ripple);
                                requestAnimationFrame(() => {
                                    ripple.style.transform = 'translate(-50%, -50%) scale(2.8)';
                                    ripple.style.opacity = '0';
                                    ripple.style.borderWidth = '0px';
                                });
                                setTimeout(() => ripple.remove(), 600);
                            } else if (action === 'pop') {
                                launcher.style.transform = 'scale(0.85)'; // Deeper press
                                setTimeout(() => launcher.style.transform = 'scale(1)', 150);
                            } else if (action === 'shake') {
                                triggerAnimation(launcher, 'icon-shake', 500);
                            } else if (action === 'flip') {
                                triggerAnimation(launcher, 'icon-flip', 800);
                            }
                        }
                    });

                    launcher.addEventListener('mouseup', () => {
                        launcher.classList.remove('is-active');
                    });

                    launcher.addEventListener('mouseleave', () => {
                        launcher.classList.remove('is-active');
                    });
                }

                // End of ApplyCustomization
            }
        } catch (error) {
            console.error('❌ Cluaiz: Failed to apply customization', error);
        }
    }


    // Notification Badge System
    let notificationBadge = null;
    let notificationCount = 0;

    function showNotification(count = 1) {
        notificationCount = count;

        // Add notification state
        launcher.classList.add('has-notification');

        // Create or update badge
        if (!notificationBadge) {
            notificationBadge = document.createElement('div');
            notificationBadge.className = 'notification-badge';
            launcher.appendChild(notificationBadge);
        }

        notificationBadge.textContent = notificationCount > 9 ? '9+' : notificationCount;
        notificationBadge.style.display = 'flex';

        console.log(`🔔 Cluaiz: Notification shown (${notificationCount})`);
    }

    function clearNotification() {
        launcher.classList.remove('has-notification');
        if (notificationBadge) {
            notificationBadge.style.display = 'none';
        }
        notificationCount = 0;
        console.log('✅ Cluaiz: Notification cleared');
    }

    // Clear notification when chat opens
    launcher.addEventListener('click', () => {
        setTimeout(clearNotification, 300);
    });

    // Listen for external notification events
    window.addEventListener('message', (event) => {
        if (event.data.type === 'CLUAIZ_NEW_MESSAGE') {
            const count = event.data.count || 1;
            showNotification(count);
        }
    });

    // Expose for testing/external use
    window.cluaizShowNotification = showNotification;
    window.cluaizClearNotification = clearNotification;

    // Listen for real-time updates
    window.addEventListener('cluaiz-config-update', (event) => {
        console.log('🔄 Cluaiz: Config update received', event.detail);
        applyCustomization();

        // Update iframe position if it exists and is open
        if (iframe && currentConfig && currentConfig.position) {
            const pos = currentConfig.position;
            const offsetX = pos.offsetX || 20;
            const offsetY = pos.offsetY || 20;
            const gap = 10;

            const launcherRect = launcher.getBoundingClientRect();
            const launcherSize = Math.max(launcherRect.width, launcherRect.height);

            console.log(`🔄 Real-time iframe reposition: ${pos.vertical}-${pos.horizontal}`);

            iframe.style.left = '';
            iframe.style.right = '';
            iframe.style.top = '';
            iframe.style.bottom = '';

            if (pos.horizontal === 'left') {
                iframe.style.left = `${offsetX + launcherSize + gap}px`;
            } else {
                iframe.style.right = `${offsetX + launcherSize + gap}px`;
            }

            if (pos.vertical === 'top') {
                iframe.style.top = `${offsetY}px`;
            } else {
                iframe.style.bottom = `${offsetY}px`;
            }
        }
    });

    // ========================================
    // 💬 CHAT FUNCTIONALITY
    // ========================================
    let iframe = null, isOpen = false;
    const urlParams = new URLSearchParams(window.location.search);

    function toggleChat(forceOpen) {
        if (forceOpen !== undefined) isOpen = forceOpen;
        else isOpen = !isOpen;

        if (botAnim) {
            botAnim.style.animation = isOpen ? 'bot-nod 1.5s ease-in-out infinite' : 'bot-idle 4s ease-in-out infinite';
        }

        if (isOpen) {
            if (!iframe) {
                const scriptTag = document.querySelector('script[data-org-id]');
                const orgId = scriptTag ? scriptTag.getAttribute('data-org-id') : '6923215949f85ef492c77fdb';

                iframe = document.createElement('iframe');
                iframe.id = 'cluaiz-iframe';
                iframe.setAttribute('allow', 'microphone; camera; clipboard-write;');
                const autoAnswer = urlParams.get('auto_answer') === '1' ? '&auto_answer=1' : '';
                iframe.src = `http://localhost:3000/embed/chat?embed=1&orgId=${orgId}${autoAnswer}`;

                // Dynamic positioning based on launcher config
                if (currentConfig && currentConfig.position) {
                    const pos = currentConfig.position;
                    const offsetX = pos.offsetX || 20;
                    const offsetY = pos.offsetY || 20;
                    const gap = 10; // Gap between launcher and iframe
                    // Get ACTUAL launcher size from DOM
                    const launcherRect = launcher.getBoundingClientRect();
                    const launcherSize = Math.max(launcherRect.width, launcherRect.height);
                    console.log(`🎯 Iframe positioning: launcher size=${launcherSize}px, pos=${pos.vertical}-${pos.horizontal}`);

                    // Clear default positions
                    iframe.style.left = '';
                    iframe.style.right = '';
                    iframe.style.top = '';
                    iframe.style.bottom = '';

                    // Set horizontal position with gap from launcher
                    if (pos.horizontal === 'left') {
                        // Launcher on left edge, iframe appears to its right with gap
                        iframe.style.left = `${offsetX + launcherSize + gap}px`;
                    } else {
                        // Launcher on right edge, iframe appears to its left with gap
                        iframe.style.right = `${offsetX + launcherSize + gap}px`;
                    }

                    // Set vertical position (SAME as launcher, not above/below)
                    if (pos.vertical === 'top') {
                        iframe.style.top = `${offsetY}px`;
                    } else {
                        iframe.style.bottom = `${offsetY}px`;
                    }
                }

                document.body.appendChild(iframe);

                iframe.onload = () => {
                    iframe.contentWindow.postMessage({
                        type: 'CLUAIZ_CONTEXT',
                        url: window.location.href,
                        title: document.title
                    }, '*');
                }
            }
            setTimeout(() => iframe.classList.add('cluaiz-visible'), 10);
        } else {
            if (iframe) iframe.classList.remove('cluaiz-visible');
        }
    }

    launcher.addEventListener('click', () => toggleChat());

    // Auto-open logic (from push notifications)
    if (urlParams.get('auto_answer') === '1' || urlParams.get('open_call') === '1') {
        toggleChat(true);
    }

    window.addEventListener('message', (event) => {
        if (event.data === 'CLUAIZ_CLOSE') {
            isOpen = false;
            if (botAnim) botAnim.style.animation = 'bot-idle 4s ease-in-out infinite';
            if (iframe) iframe.classList.remove('cluaiz-visible');
        }

        if (event.data.type === 'CLUAIZ_BOT_STATE' && botAnim) {
            const state = event.data.state;
            botAnim.style.animation = 'none';
            botAnim.style.transform = 'none';
            void botAnim.offsetWidth;

            if (state === 'listening') botAnim.style.animation = 'bot-nod 1.5s ease-in-out infinite';
            else if (state === 'excited') botAnim.style.animation = 'bot-bouncing 0.5s ease-in-out infinite';
            else if (state === 'sad') { botAnim.style.transform = 'translateY(5px) scale(0.95)'; botAnim.style.transition = 'transform 0.5s'; }
            else if (state === 'thinking') botAnim.style.animation = 'bot-idle 2s ease-in-out infinite';
            else botAnim.style.animation = 'bot-idle 4s ease-in-out infinite';
        }
    });

    // ========================================
    // 📊 ANALYTICS
    // ========================================
    const scriptTag = document.querySelector('script[data-org-id]');
    const showAnalytics = scriptTag && scriptTag.getAttribute('data-show-analytics') === 'true';
    const orgId = scriptTag ? scriptTag.getAttribute('data-org-id') : '6923215949f85ef492c77fdb';

    if (showAnalytics) {
        const badge = document.createElement('div');
        badge.id = 'cluaiz-analytics-badge';
        badge.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
            </svg>
            <span>View Stats</span>
        `;
        document.body.appendChild(badge);
        setTimeout(() => badge.classList.add('visible'), 1000);

        let analyticsIframe = null;
        let isAnalyticsOpen = false;

        badge.addEventListener('click', () => {
            isAnalyticsOpen = !isAnalyticsOpen;

            if (isAnalyticsOpen) {
                if (!analyticsIframe) {
                    analyticsIframe = document.createElement('iframe');
                    analyticsIframe.id = 'cluaiz-analytics-iframe';
                    analyticsIframe.src = `http://localhost:3000/embed/analytics?orgId=${orgId}`;
                    document.body.appendChild(analyticsIframe);
                }
                setTimeout(() => analyticsIframe.classList.add('visible'), 10);
                badge.innerHTML = `<span>Close Stats</span>`;
            } else {
                if (analyticsIframe) analyticsIframe.classList.remove('visible');
                badge.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
                    </svg>
                    <span>View Stats</span>
                `;
            }
        });
    }

    // ========================================
    // 👂 LIVE PREVIEW LISTENERS (Real-time Updates)
    // ========================================
    window.addEventListener('cluaiz-config-update', (event) => {
        console.log('⚡ Cluaiz: Received live config update event', event.detail);
        if (event.detail) {
            applyCustomization(event.detail);
        } else {
            applyCustomization();
        }
    });

    window.addEventListener('storage', (event) => {
        if (event.key === 'cluaiz-widget-config') {
            console.log('📦 Cluaiz: Storage updated, refreshing config');
            applyCustomization();
        }
    });

    console.log('✅ Cluaiz Widget Ready!');
    window.dispatchEvent(new CustomEvent('CLUAIZ_WIDGET_READY'));
})();