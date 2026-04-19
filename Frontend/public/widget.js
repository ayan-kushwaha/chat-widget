"use strict";(()=>{var S=`
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
        width: 100%; height: 100%; position: relative;
        display: flex; align-items: center; justify-content: center;
        background: var(--box-bg, linear-gradient(135deg, var(--gradient-color1), var(--gradient-color2)));
        border-radius: var(--box-radius, 50%);
        box-shadow: var(--box-shadow, 0 8px 32px rgba(0,0,0,0.15));
        border: var(--box-border, 1px solid rgba(255,255,255,0.15));
    }
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
    @keyframes bot-nod {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(8px) rotate(-5deg); }
    }
    @keyframes robot-float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        25% { transform: translateY(calc(-5px * var(--anim-intensity, 1))) rotate(calc(-1deg * var(--anim-intensity, 1))); }
        50% { transform: translateY(calc(-8px * var(--anim-intensity, 1))) rotate(0deg); }
        75% { transform: translateY(calc(-5px * var(--anim-intensity, 1))) rotate(calc(1deg * var(--anim-intensity, 1))); }
    }
    @keyframes robot-wave {
        0%, 100% { transform: rotate(0deg); }
        10%, 30% { transform: rotate(calc(-8deg * var(--anim-intensity, 1))); }
        20%, 40% { transform: rotate(calc(8deg * var(--anim-intensity, 1))); }
        50% { transform: rotate(0deg); }
    }
    @keyframes robot-bounce {
        0%, 100% { transform: translateY(0) scaleY(1); }
        10% { transform: translateY(0) scaleY(1.1) scaleX(0.9); }
        30% { transform: translateY(calc(-20px * var(--anim-intensity, 1))) scaleY(1.15) scaleX(0.95); }
        50% { transform: translateY(0) scaleY(0.9) scaleX(1.05); }
        57% { transform: translateY(calc(-7px * var(--anim-intensity, 1))) scaleY(1.05) scaleX(0.95); }
        64% { transform: translateY(0) scaleY(1); }
    }
    @keyframes robot-peep {
        0%, 100% { transform: rotate(0deg) translateX(0); }
        25% { transform: rotate(calc(-15deg * var(--anim-intensity, 1))) translateX(calc(-5px * var(--anim-intensity, 1))); }
        35% { transform: rotate(calc(-15deg * var(--anim-intensity, 1))) translateX(calc(-5px * var(--anim-intensity, 1))); }
        40% { transform: rotate(0deg) translateX(0); }
    }
    @keyframes robot-glitch {
        0%, 100% { transform: translate(0, 0); filter: none; }
        10% { transform: translate(calc(-2px * var(--anim-intensity, 1)), calc(2px * var(--anim-intensity, 1))); filter: hue-rotate(90deg); }
        20% { transform: translate(calc(2px * var(--anim-intensity, 1)), calc(-2px * var(--anim-intensity, 1))); filter: hue-rotate(-90deg); }
        30% { transform: translate(0, 0); filter: none; }
    }
    @keyframes robot-spin {
        0%, 100% { transform: rotate(0deg) translateY(0); }
        25% { transform: rotate(calc(-12deg * var(--anim-intensity, 1))) translateY(calc(-4px * var(--anim-intensity, 1))); }
        75% { transform: rotate(calc(12deg * var(--anim-intensity, 1))) translateY(calc(-4px * var(--anim-intensity, 1))); }
    }
    @keyframes box-ripple {
        0% { box-shadow: 0 0 0 0 var(--secondary-color), 0 0 0 0 var(--primary-color); }
        40% { box-shadow: 0 0 0 calc(15px * var(--anim-intensity, 1)) rgba(255,255,255,0), 0 0 0 0 var(--primary-color); }
        80% { box-shadow: 0 0 0 calc(15px * var(--anim-intensity, 1)) rgba(255,255,255,0), 0 0 0 calc(30px * var(--anim-intensity, 1)) rgba(255,255,255,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,255,255,0), 0 0 0 calc(30px * var(--anim-intensity, 1)) rgba(255,255,255,0); }
    }
    @keyframes icon-ripple {
        0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(59,130,246,0.4)); }
        50% { transform: scale(1.05); filter: drop-shadow(0 0 15px var(--primary-color)); }
        100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(59,130,246,0.4)); }
    }
    @keyframes box-glow {
        0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 0 10px var(--primary-color, #3B82F6); }
        50% { box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 0 25px var(--primary-color, #3B82F6); }
    }
    @keyframes icon-glow {
        0%, 100% { filter: drop-shadow(0 0 2px var(--primary-color, #3B82F6)) drop-shadow(0 0 4px var(--primary-color, #3B82F6)); opacity: 1; }
        50% { filter: drop-shadow(0 0 8px var(--primary-color, #3B82F6)) drop-shadow(0 0 16px var(--primary-color, #3B82F6)); opacity: 1; }
    }
    @keyframes icon-float {
        0%, 100% { transform: translateY(0px) scale(var(--icon-scale, 1)); }
        50% { transform: translateY(-4px) scale(var(--icon-scale, 1)); }
    }
    @keyframes icon-pulse {
        0%, 100% { transform: scale(var(--icon-scale, 1)); filter: brightness(100%); }
        50% { transform: scale(calc(var(--icon-scale, 1) * 1.1)); filter: brightness(120%); }
    }
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
    @keyframes icon-shake {
        0%, 100% { transform: scale(var(--icon-scale, 1)) translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: scale(var(--icon-scale, 1)) translateX(-3px); }
        20%, 40%, 60%, 80% { transform: scale(var(--icon-scale, 1)) translateX(3px); }
    }
    @keyframes icon-bounce {
        0%, 100% { transform: scale(var(--icon-scale, 1)) translateY(0); }
        50% { transform: scale(var(--icon-scale, 1)) translateY(calc(-10px * var(--anim-intensity, 1))); }
    }
    @keyframes icon-swing {
        20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); }
        60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); }
        0%, 100% { transform: rotate(0deg); }
    }
    @keyframes icon-beat {
        0%, 100% { transform: scale(var(--icon-scale, 1)); }
        14% { transform: scale(calc(var(--icon-scale, 1) * 1.3)); }
        28% { transform: scale(var(--icon-scale, 1)); }
        42% { transform: scale(calc(var(--icon-scale, 1) * 1.3)); }
        70% { transform: scale(var(--icon-scale, 1)); }
    }
    @keyframes icon-tilt {
        0%, 100% { transform: perspective(100px) rotateX(0deg) rotateY(0deg); }
        25% { transform: perspective(100px) rotateX(5deg) rotateY(5deg); }
        50% { transform: perspective(100px) rotateX(-5deg) rotateY(5deg); }
        75% { transform: perspective(100px) rotateX(-5deg) rotateY(-5deg); }
    }

    .robot-float { animation: robot-float calc(4s / var(--anim-speed)) ease-in-out infinite; }
    .robot-wave { animation: robot-wave calc(3s / var(--anim-speed)) ease-in-out infinite; }
    .robot-bounce { animation: robot-bounce calc(1.5s / var(--anim-speed)) ease-in-out infinite; }
    .robot-peep { animation: robot-peep calc(5s / var(--anim-speed)) ease-in-out infinite; }
    .robot-glitch { animation: robot-glitch calc(3s / var(--anim-speed)) steps(1) infinite; }
    .robot-spin { animation: robot-spin calc(2s / var(--anim-speed)) ease-in-out infinite; }
    .bot-nod { animation: bot-nod 0.6s ease-in-out; }

    .cluaiz-icon-animator { transform-origin: center center; will-change: transform; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .cluaiz-icon-float { transform-origin: center center; will-change: transform; transform: scale(var(--icon-scale, 1)); transition: all 0.3s ease; }

    .box-anim-ripple .cluaiz-box { animation: box-ripple calc(4s / var(--anim-speed)) cubic-bezier(0, 0, 0.2, 1) infinite; }
    .box-anim-pulse .cluaiz-box { animation: icon-pulse calc(4s / var(--anim-speed)) ease-in-out infinite; }
    .box-anim-morph .cluaiz-box { animation: box-morph calc(10s / var(--anim-speed)) ease-in-out infinite; }
    .box-anim-glow .cluaiz-box { animation: box-glow calc(5s / var(--anim-speed)) ease-in-out infinite; }
    .box-anim-shake .cluaiz-box { animation: icon-shake calc(4s / var(--anim-speed)) ease-in-out infinite; }
    .box-anim-bounce .cluaiz-box { animation: icon-bounce calc(2s / var(--anim-speed)) ease-in-out infinite; }
    .box-anim-swing .cluaiz-box { animation: icon-swing calc(4s / var(--anim-speed)) ease-in-out infinite; }
    .box-anim-beat .cluaiz-box { animation: icon-beat calc(3s / var(--anim-speed)) ease-in-out infinite; }
    .box-anim-tilt .cluaiz-box { animation: icon-tilt calc(6s / var(--anim-speed)) ease-in-out infinite; }

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

    #cluaiz-launcher.is-hovered { transform: scale(1.05); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    #cluaiz-launcher.hover-effect-scale.is-hovered { transform: scale(1.15); }
    #cluaiz-launcher.hover-effect-tilt.is-hovered { transform: rotate(15deg) scale(1.1); }
    #cluaiz-launcher.is-active { transform: scale(0.95); transition: transform 0.1s ease-out; }
    #cluaiz-launcher.has-notification { animation: attention-pulse 1.5s ease-in-out infinite; }
    #cluaiz-launcher.cluaiz-dragging { cursor: grabbing !important; z-index: 2147483648; opacity: 0.8; }

    @keyframes attention-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

    .notification-badge {
        position: absolute; top: -5px; right: -5px; min-width: 20px; height: 20px; padding: 0 6px;
        background: #EF4444; border-radius: 10px; font-size: 11px; font-weight: 600; color: white;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.6);
        animation: badge-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); z-index: 10;
    }
    @keyframes badge-pop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }

    @keyframes entrance-popup {
        0% { transform: translateY(100px) scale(0); opacity: 0; }
        60% { transform: translateY(-10px) scale(1.1); }
        80% { transform: translateY(5px) scale(0.95); }
        100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes entrance-slide { 0% { transform: translateX(100px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
    @keyframes entrance-fade { 0% { opacity: 0; } 100% { opacity: 1; } }
    @keyframes entrance-zoom { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes entrance-rotate { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
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

    @keyframes gradient-pulse { 0% { filter: brightness(1); } 50% { filter: brightness(1.1) saturate(1.2); } 100% { filter: brightness(1); } }
    .gradient-animated .robot-body { animation: gradient-pulse 2s ease-in-out infinite; }

    /* \u2500\u2500 Chat Iframe \u2500\u2500 */
    #cluaiz-iframe {
        position: fixed; width: 380px; height: 600px;
        border: none; border-radius: 18px; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        z-index: 2147483646; opacity: 0; pointer-events: none;
        transform: translateY(20px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #cluaiz-iframe.cluaiz-visible { opacity: 1; pointer-events: all; transform: translateY(0) scale(1); }
    #cluaiz-iframe.cluaiz-sidebar-mode {
        transform: none !important; box-shadow: -5px 0 30px rgba(0,0,0,0.1);
        transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), left 0.3s cubic-bezier(0.16, 1, 0.3, 1), right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* \u2500\u2500 Resizer \u2500\u2500 */
    #cluaiz-resizer {
        position: fixed; width: 10px; height: 100vh;
        z-index: 2147483647; background: transparent; transition: background 0.2s;
        display: none; align-items: center; justify-content: center; cursor: col-resize;
    }
    #cluaiz-resizer.active { display: flex; }
    #cluaiz-resizer:hover { background: rgba(59, 130, 246, 0.3); }
    .cluaiz-resizer { position: fixed !important; z-index: 2147483648 !important; background: transparent; border-radius: 4px; }
    .cluaiz-resizer:hover { background: rgba(59, 130, 246, 0.2); }
    .cluaiz-resizer-r { width: 6px; cursor: col-resize; }
    .cluaiz-resizer-l { width: 6px; cursor: col-resize; }
    .cluaiz-resizer-t { height: 6px; cursor: row-resize; }
    .cluaiz-resizer-b { height: 6px; cursor: row-resize; }
    #cluaiz-resizer-handle {
        position: absolute; top: 50%; transform: translateY(-50%);
        width: 10px; height: 40px; opacity: 0.7;
        background: var(--cluaiz-gradient, linear-gradient(135deg, var(--gradient-color1, var(--cluaiz-primary-color, #ffffff)), var(--gradient-color2, var(--cluaiz-primary-color, #ffffff))));
        border-radius: 12px; display: flex; align-items: center; justify-content: center;
        color: var(--icon-color, #1e293b); box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        cursor: pointer; transition: transform 0.2s, background 0.2s; z-index: 2147483648;
    }
    #cluaiz-resizer-handle:hover { opacity: 1; transform: translateY(-50%) scale(1.1); filter: brightness(1.1); }
    #cluaiz-resizer-handle svg { width: 20px; height: 20px; fill: currentColor; transition: transform 0.3s; }

    /* \u2500\u2500 Snap Shadow \u2500\u2500 */
    .cluaiz-snap-shadow {
        position: fixed; top: 0; height: 100vh; background: rgba(59, 130, 246, 0.1);
        border: 2px dashed var(--cluaiz-primary-color, rgba(59, 130, 246, 0.5));
        z-index: 2147483645; pointer-events: none; opacity: 0;
        transition: opacity 0.2s, width 0.2s, left 0.2s, right 0.2s, top 0.2s, height 0.2s, border-radius 0.2s;
    }
    .cluaiz-snap-shadow.visible { opacity: 1; }
    .cluaiz-snap-shadow.floating-preview {
        background: rgba(255, 255, 255, 0.05);
        border: 2px dashed rgba(59, 130, 246, 0.6); box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    /* \u2500\u2500 Body states \u2500\u2500 */
    body.cluaiz-squeezed { transition: padding 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    body.cluaiz-resizing, body.cluaiz-resizing * { cursor: col-resize !important; user-select: none !important; -webkit-user-select: none !important; }
    body.cluaiz-resizing #cluaiz-iframe, body.cluaiz-resizing { transition: none !important; }
    body.cluaiz-resizing #cluaiz-iframe { pointer-events: none !important; }
    body.cluaiz-dragging-active, body.cluaiz-dragging-active * { user-select: none !important; -webkit-user-select: none !important; }

    @media (max-width: 480px) {
        #cluaiz-iframe { width: 92%; height: 75%; }
        #cluaiz-launcher { width: 80px; height: 80px; }
    }

    /* \u2500\u2500 Analytics \u2500\u2500 */
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

    @keyframes cluaiz-pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
    }
    @keyframes cluaiz-pop {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.15); }
        80% { transform: scale(0.95); }
        100% { transform: scale(1); opacity: 1; }
    }
    .cluaiz-preview-bubble:hover {
        transform: translateY(-5px) scale(1.02) !important;
        background-color: rgba(255, 255, 255, 0.95) !important;
    }
`;var b=class{constructor(t,e){this.orgId=t,this.onConfigUpdate=e;let o=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";this.apiUrl=o?"http://localhost:4000/v1":"https://api.cluaiz.com/v1"}async fetchConfig(){try{let e=await(await fetch(`${this.apiUrl}/bots/default_bot/config`,{headers:{"x-org-id":this.orgId}})).json();e?.widgetConfig&&this.onConfigUpdate(e.widgetConfig)}catch(t){console.error("\u274C Cluaiz: Failed to fetch config",t)}}async sendHeartbeat(){try{await fetch(`${this.apiUrl}/analytics/heartbeat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orgId:this.orgId,url:window.location.href,domain:window.location.hostname})})}catch{}}initEventListeners(){window.addEventListener("cluaiz-config-update",t=>{console.log("\u{1F504} Cluaiz: Config update received",t.detail),t.detail?this.onConfigUpdate(t.detail):this.fetchConfig()}),window.addEventListener("storage",t=>{t.key==="cluaiz-widget-config"&&this.fetchConfig()})}startHeartbeat(){this.sendHeartbeat(),setInterval(()=>this.sendHeartbeat(),300*1e3)}};var z={chat:`
        <div class="cluaiz-box">
            <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                <svg viewBox="0 0 116 123" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                    <path d="M17.2,0h59.47c4.73,0,9.03,1.93,12.15,5.05c3.12,3.12,5.05,7.42,5.05,12.15v38.36c0,4.73-1.93,9.03-5.05,12.15 c-3.12,3.12-7.42,5.05-12.15,5.05H46.93L20.81,95.21c-1.21,1.04-3.04,0.9-4.08-0.32c-0.51-0.6-0.74-1.34-0.69-2.07l1.39-20.07H17.2 c-4.73,0-9.03-1.93-12.15-5.05C1.93,64.59,0,60.29,0,55.56V17.2c0-4.73,1.93-9.03,5.05-12.15C8.16,1.93,12.46,0,17.2,0L17.2,0z M102.31,27.98c3.37,0.65,6.39,2.31,8.73,4.65c3.05,3.05,4.95,7.26,4.95,11.9v38.36c0,4.64-1.89,8.85-4.95,11.9 c-3.05,3.05-7.26,4.95-11.9,4.95h-0.61l1.42,20.44l0,0c0.04,0.64-0.15,1.3-0.6,1.82c-0.91,1.07-2.52,1.19-3.58,0.28l-26.22-23.2 H35.01l17.01-17.3h36.04c7.86,0,14.3-6.43,14.3-14.3V29.11C102.35,28.73,102.34,28.35,102.31,27.98L102.31,27.98z M25.68,43.68 c-1.6,0-2.9-1.3-2.9-2.9c0-1.6,1.3-2.9,2.9-2.9h30.35c1.6,0,2.9,1.3,2.9,2.9c0,1.6-1.3,2.9-2.9,2.9H25.68L25.68,43.68z M25.68,29.32c-1.6,0-2.9-1.3-2.9-2.9c0-1.6,1.3-2.9,2.9-2.9H68.7c1.6,0,2.9,1.3,2.9,2.9c0,1.6-1.3,2.9-2.9,2.9H25.68L25.68,29.32z M76.66,5.8H17.2c-3.13,0-5.98,1.28-8.05,3.35C7.08,11.22,5.8,14.06,5.8,17.2v38.36c0,3.13,1.28,5.98,3.35,8.05 c2.07,2.07,4.92,3.35,8.05,3.35h3.34v0.01l0.19,0.01c1.59,0.11,2.8,1.49,2.69,3.08l-1.13,16.26L43.83,67.8 c0.52-0.52,1.24-0.84,2.04-0.84h30.79c3.13,0,5.98-1.28,8.05-3.35c2.07-2.07,3.35-4.92,3.35-8.05V17.2c0-3.13-1.28-5.98-3.35-8.05 C82.65,7.08,79.8,5.8,76.66,5.8L76.66,5.8z" />
                </svg>
            </div>
        </div>
    `,message:`
        <div class="cluaiz-box">
            <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                <svg viewBox="0 0 123 107" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                    <path d="M56,92.15a38.3,38.3,0,0,0,11.23,5.78c8.41,2.66,17.75,2.25,27.12-1.74a2.72,2.72,0,0,1,2-.08l12,4L107,90.36a2.78,2.78,0,0,1,1-2.53,28.41,28.41,0,0,0,6.31-6.8,17.53,17.53,0,0,0,2.73-12.47,27,27,0,0,0-6-12.5c-.6-.76-1.25-1.5-1.92-2.23h0a42.62,42.62,0,0,0,1.27-6.59,50,50,0,0,1,5,5.34,32.71,32.71,0,0,1,7.14,15.14A23,23,0,0,1,119.05,84a32.7,32.7,0,0,1-6.29,7.12l1.61,12.4a2.79,2.79,0,0,1-3.6,3.21l-15.24-5a43.85,43.85,0,0,1-30,1.53A45,45,0,0,1,47.47,92.16c.65,0,1.33.06,2.06.09,2.18.06,4.34,0,6.46-.1ZM72.11,35.22a6.39,6.39,0,1,1-6.38,6.39,6.39,6.39,0,0,1,6.38-6.39Zm-42.18,0a6.39,6.39,0,1,1-6.38,6.39,6.39,6.39,0,0,1,6.38-6.39Zm21.09,0a6.39,6.39,0,1,1-6.38,6.39A6.38,6.38,0,0,1,51,35.22ZM52.3,0h.05C66.29.46,78.79,5.42,87.74,13.09,96.89,20.93,102.37,31.6,102,43.26v0c-.36,11.66-6.48,22-16.1,29.3-9.41,7.14-22.22,11.36-36.16,11A62.05,62.05,0,0,1,38.5,82.2a58.64,58.64,0,0,1-9.43-2.87l-22.83,9,7.65-18.19a42.35,42.35,0,0,1-10-12.73A35.22,35.22,0,0,1,0,40.3C.37,28.63,6.49,18.28,16.11,11,25.53,3.83,38.33-.38,52.28,0Zm-.17,6.35h-.05C39.62,6,28.25,9.74,19.94,16,11.83,22.2,6.66,30.83,6.37,40.47A29.15,29.15,0,0,0,9.56,54.53,36.92,36.92,0,0,0,19.7,66.69l1.89,1.51-3.65,8.67,11.21-4.41,1.2.51a52.07,52.07,0,0,0,9.47,3A57,57,0,0,0,49.94,77.2c12.47.36,23.85-3.36,32.16-9.66,8.11-6.16,13.28-14.79,13.57-24.43v0C96,33.44,91.32,24.54,83.6,17.92c-7.91-6.78-19-11.16-31.45-11.54Z" />
                </svg>
            </div>
        </div>
    `,comment:`
        <div class="cluaiz-box">
            <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                <svg viewBox="0 0 123 123" class="cluaiz-icon-float" style="width:55%; height:55%; transform: scale(var(--icon-scale, 1)); fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                    <path d="M31.23,113.89,30,115.11a5.2,5.2,0,0,1-9-3.48V99.45H19.39A9,9,0,0,1,13,96.79a9.28,9.28,0,0,1-1.82-2.61h-.44A10.75,10.75,0,0,1,0,83.45V10.73A10.68,10.68,0,0,1,2.8,3.56l.36-.4A10.72,10.72,0,0,1,10.73,0h94.41A10.81,10.81,0,0,1,115.7,8.79a9.2,9.2,0,0,1,4.51,2.47,9.05,9.05,0,0,1,2.67,6.4V90.38a9.08,9.08,0,0,1-9.07,9.07h-54L37.39,120.93a3.54,3.54,0,0,1-6.16-2.37v-4.67ZM27.94,60.37a3.54,3.54,0,0,1,0-7.07H76.87a3.54,3.54,0,1,1,0,7.07Zm0-23a3.54,3.54,0,0,1,0-7.07h60a3.54,3.54,0,0,1,0,7.07ZM26.1,111.63,49.71,89h55.43a5.55,5.55,0,0,0,5.54-5.53V10.73a5.58,5.58,0,0,0-5.54-5.53H10.73A5.59,5.59,0,0,0,5.2,10.73V83.45A5.57,5.57,0,0,0,10.73,89H26.1v22.65Z"/>
                </svg>
            </div>
        </div>
    `,sparkles:`
        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background: var(--box-bg, linear-gradient(135deg, var(--gradient-color1), var(--gradient-color2))); border-radius:50%; box-shadow: var(--box-shadow, 0 8px 32px rgba(0,0,0,0.15)); border: var(--box-border, 1px solid rgba(255,255,255,0.15));">
            <div class="cluaiz-icon-animator" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                <svg viewBox="0 0 123 119" class="cluaiz-icon-float" style="width:60%; height:60%; fill:var(--icon-fill, var(--icon-color, white)); stroke:var(--icon-stroke, none); stroke-width:var(--icon-stroke-width, 0px);">
                    <path d="M57.49,29.2V23.53a14.41,14.41,0,0,1-2-.93A12.18,12.18,0,0,1,50.44,7.5a12.39,12.39,0,0,1,2.64-3.95A12.21,12.21,0,0,1,57,.92,12,12,0,0,1,61.66,0,12.14,12.14,0,0,1,72.88,7.5a12.14,12.14,0,0,1,0,9.27,12.08,12.08,0,0,1-2.64,3.94l-.06.06a12.74,12.74,0,0,1-2.36,1.83,11.26,11.26,0,0,1-2,.93V29.2H94.3a15.47,15.47,0,0,1,15.42,15.43v2.29H115a7.93,7.93,0,0,1,7.9,7.91V73.2A7.93,7.93,0,0,1,115,81.11h-5.25v2.07A15.48,15.48,0,0,1,94.3,98.61H55.23L31.81,118.72a2.58,2.58,0,0,1-3.65-.29,2.63,2.63,0,0,1-.63-1.85l1.25-18h-.21A15.45,15.45,0,0,1,13.16,83.18V81.11H7.91A7.93,7.93,0,0,1,0,73.2V54.83a7.93,7.93,0,0,1,7.9-7.91h5.26v-2.3A15.45,15.45,0,0,1,28.57,29.2H57.49ZM82.74,47.32a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm-42.58,0a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm6.38,31.36a2.28,2.28,0,0,1-.38-.38,2.18,2.18,0,0,1-.52-1.36,2.21,2.21,0,0,1,.46-1.39,2.4,2.4,0,0,1,.39-.39,3.22,3.22,0,0,1,3.88-.08A22.36,22.36,0,0,0,56,78.32a14.86,14.86,0,0,0,5.47,1A16.18,16.18,0,0,0,67,78.22,25.39,25.39,0,0,0,72.75,75a3.24,3.24,0,0,1,3.89.18,3,3,0,0,1,.37.41,2.22,2.22,0,0,1,.42,1.4,2.33,2.33,0,0,1-.58,1.35,2.29,2.29,0,0,1-.43.38,30.59,30.59,0,0,1-7.33,4,22.28,22.28,0,0,1-7.53,1.43A21.22,21.22,0,0,1,54,82.87a27.78,27.78,0,0,1-7.41-4.16l0,0ZM94.29,34.4H28.57A10.26,10.26,0,0,0,18.35,44.63V83.18A10.26,10.26,0,0,0,28.57,93.41h3.17a2.61,2.61,0,0,1,2.41,2.77l-1,14.58L52.45,94.15a2.56,2.56,0,0,1,1.83-.75h40a10.26,10.26,0,0,0,10.22-10.23V44.62A10.24,10.24,0,0,0,94.29,34.4Z"/>
                </svg>
            </div>
        </div>
    `,cluaiz3bairobot:`
        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
            <div style="width:100%; height:100%; position:relative;">
                <iframe src="http://localhost:3000/embed/avatar" style="width:100%; height:100%; position:absolute; top:0; left:0; border:none; background:transparent; pointer-events:none;" allowtransparency="true"></iframe>
            </div>
        </div>
    `},E=`
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
`;function x(u,t,e=1e3){u&&(u.style.animation="none",u.offsetWidth,u.style.animation=`${t} ${e}ms ease-in-out`,setTimeout(()=>{u&&(u.style.animation="")},e))}var v=class{constructor(){this.config=null;this.botElements={};this.mouseX=0;this.mouseY=0;this.rafId=null;this.currentUnreadCount=0;this.lastPreviewText="";this.isDragging=!1;this.clickWasDrag=!1;this.dragStartX=0;this.dragStartY=0;this.originalX=0;this.originalY=0;this.currentPos=JSON.parse(localStorage.getItem("cluaiz_pos")||"null");this.isSidebar=localStorage.getItem("cluaiz_mode")==="sidebar";this.side=localStorage.getItem("cluaiz_side")||"right";this.isInteractionExpanded=!1;this.handleMouseMove=t=>{this.mouseX=t.clientX,this.mouseY=t.clientY,this.rafId||(this.rafId=requestAnimationFrame(this.updateAnimation))};this.updateAnimation=()=>{if(this.rafId=null,!this.element)return;let t=this.element.getBoundingClientRect(),e=t.left+t.width/2,o=t.top+t.height/2,i=this.mouseX-e,a=this.mouseY-o,s=Math.sqrt(i*i+a*a);document.querySelectorAll("iframe").forEach(l=>{l.contentWindow&&l.contentWindow.postMessage({type:"CLUAIZ_EXTERNAL_MOUSE",x:i,y:a,r:s},"*")});let n=this.getScaling(),r=100*n.factor,c=1.2*n.factor,d=s<t.width/2+r,p=s<t.width/2;if(document.querySelectorAll("iframe").forEach(l=>{l.contentWindow&&l.contentWindow.postMessage({type:"CLUAIZ_MAGNET_HOVER",isHovered:this.isInteractionExpanded?!1:d},"*")}),Array.from(this.element.children).forEach(l=>{if(l.classList?.contains("cluaiz-notification-magnet")||l.tagName==="DIV"||l.tagName==="svg")if(d&&!this.isInteractionExpanded){let h=i/c,f=a/c,m=p?1.05:1;l.style.transition="transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",l.style.transform=`translate3d(${h}px, ${f}px, 0) scale(${m})`}else l.style.transition="transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",l.style.transform="translate3d(0, 0, 0) scale(1)"}),this.config?.icon?.type==="robot"&&this.botElements.body){let l=Math.min(s/300,1),h=i/(s||1)*l*8,f=a/(s||1)*l*6;this.botElements.face&&(this.botElements.face.style.setProperty("--offset-x",`${h*.4}px`),this.botElements.face.style.setProperty("--offset-y",`${f*.4}px`)),this.botElements.features&&(this.botElements.features.style.setProperty("--offset-x",`${h*1.2}px`),this.botElements.features.style.setProperty("--offset-y",`${f*1.2}px`));let m=i/(s||1)*l*4,y=a/(s||1)*l*4;this.element.style.setProperty("--pupil-x",`${m}px`),this.element.style.setProperty("--pupil-y",`${y}px`)}};this.notifyIframeHover=t=>{document.querySelectorAll("iframe").forEach(e=>{e.contentWindow&&e.contentWindow.postMessage({type:"CLUAIZ_EXTERNAL_HOVER",isHovered:t},"*")})};this.element=document.createElement("div"),this.element.id="cluaiz-launcher",document.body.appendChild(this.element),this.snapShadow=document.createElement("div"),this.snapShadow.className="cluaiz-snap-shadow",document.body.appendChild(this.snapShadow),this.applyConfig({theme:{primaryColor:"#3B82F6",secondaryColor:"#8B5CF6",useGradient:!0,iconColor:"#FFFFFF",iconStyle:"solid",showBox:!0,boxRadius:50,iconScale:1,boxAnimation:"none"},icon:{type:"chat",size:"md"},animation:{robot:"float",simple:"ripple",entrance:"popup",speed:1,intensity:1},position:{horizontal:"right",vertical:"bottom",offsetX:20,offsetY:20},behavior:{robot:{hover:"giggle",click:"nod"},icon:{hover:"none",click:"ripple-burst"}},robot:{eyeColor:"#3B82F6",cheekColor:"#F472B6",lipColor:"#F472B6",earColor:"#0F172A",eyebrowColor:"#F59E0B",bodyColor:"#FFFFFF",useGradient:!1,gradientType:"linear",gradientColor1:"#3B82F6",gradientColor2:"#8B5CF6",gradientAngle:45,animateGradient:!1},window:{theme:"auto",colorMode:"auto"}}),this.initInteractionListeners(),this.initDragLogic(),window.addEventListener("cluaiz-sidebar-mode",t=>{this.isSidebar=!0,this.side=t.detail?.side||this.side||"right"}),window.addEventListener("cluaiz-floating-mode",()=>{this.isSidebar=!1,this.element.classList.remove("cluaiz-snapped"),this.element.style.transition="opacity 0.25s ease",this.element.style.opacity="1",this.element.style.pointerEvents="all"})}initDragLogic(){if(window.innerWidth<768)return;let t=i=>{if(i.button!==0)return;this.isDragging=!1,this.clickWasDrag=!1,this.dragStartX=i.clientX,this.dragStartY=i.clientY;let a=this.element.getBoundingClientRect();this.originalX=a.left,this.originalY=a.top,this.element.style.transition="none",document.addEventListener("mousemove",e),document.addEventListener("mouseup",o)},e=i=>{let a=i.clientX-this.dragStartX,s=i.clientY-this.dragStartY;if(!this.isDragging&&Math.sqrt(a*a+s*s)<5)return;this.isDragging||(this.isDragging=!0,this.clickWasDrag=!0,this.element.classList.add("cluaiz-dragging"),document.body.classList.add("cluaiz-dragging-active"),document.querySelectorAll("iframe").forEach(f=>f.contentWindow?.postMessage({type:"CLUAIZ_DRAG_STATE",dragging:!0},"*")));let n=Math.max(0,Math.min(window.innerWidth-this.element.offsetWidth,this.originalX+a)),r=Math.max(10,Math.min(window.innerHeight-this.element.offsetHeight-10,this.originalY+s));this.element.style.left=`${n}px`,this.element.style.top=`${r}px`,this.element.style.right="auto",this.element.style.bottom="auto";let c=(localStorage.getItem("cluaiz_width")||"380")+"px",d=(localStorage.getItem("cluaiz_height")||"600")+"px",p=parseInt(d),l=parseInt(c),h=Math.max(10,Math.min(window.innerHeight-p-10,r));if(!this.isSidebar)n<15?(this.snapShadow.classList.add("visible"),this.snapShadow.classList.remove("floating-preview"),this.snapShadow.style.left="0",this.snapShadow.style.right="auto",this.snapShadow.style.width=c,this.snapShadow.style.height="100vh",this.snapShadow.style.top="0",this.snapShadow.style.borderRadius="0"):n>window.innerWidth-this.element.offsetWidth-15?(this.snapShadow.classList.add("visible"),this.snapShadow.classList.remove("floating-preview"),this.snapShadow.style.right="0",this.snapShadow.style.left="auto",this.snapShadow.style.width=c,this.snapShadow.style.height="100vh",this.snapShadow.style.top="0",this.snapShadow.style.borderRadius="0"):this.snapShadow.classList.remove("visible","floating-preview");else if((this.side==="left"?n:window.innerWidth-this.element.offsetWidth-n)>Math.max(150,window.innerWidth*.15))if(this.snapShadow.classList.add("visible","floating-preview"),this.snapShadow.style.width=c,this.snapShadow.style.top=`${h}px`,this.snapShadow.style.height=d,this.snapShadow.style.borderRadius="18px",this.side==="left"){let m=n+this.element.offsetWidth+10;m+l>window.innerWidth-10&&(m=window.innerWidth-l-10),this.snapShadow.style.left=`${m}px`,this.snapShadow.style.right="auto"}else{let m=n-l-10;m<10&&(m=10),this.snapShadow.style.left=`${m}px`,this.snapShadow.style.right="auto"}else this.snapShadow.classList.add("visible"),this.snapShadow.classList.remove("floating-preview"),this.snapShadow.style.width=c,this.snapShadow.style.height="100vh",this.snapShadow.style.top="0",this.snapShadow.style.borderRadius="0",this.side==="left"?(this.snapShadow.style.left="0",this.snapShadow.style.right="auto"):(this.snapShadow.style.right="0",this.snapShadow.style.left="auto")},o=i=>{let a=this.isDragging;if(this.isDragging=!1,this.element.classList.remove("cluaiz-dragging"),document.body.classList.remove("cluaiz-dragging-active"),this.snapShadow.classList.remove("visible","floating-preview"),this.snapShadow.style.height="100vh",document.removeEventListener("mousemove",e),document.removeEventListener("mouseup",o),!a)return;document.querySelectorAll("iframe").forEach(c=>c.contentWindow?.postMessage({type:"CLUAIZ_DRAG_STATE",dragging:!1},"*"));let s=this.element.getBoundingClientRect(),n=s.left,r=s.top;this.isSidebar?(this.side==="left"?s.left:window.innerWidth-s.width-s.left)>Math.max(150,window.innerWidth*.15)?this.isSidebar=!1:n=this.side==="left"?10:window.innerWidth-s.width-10:s.left<15?(n=10,this.isSidebar=!0,this.side="left"):s.left>window.innerWidth-this.element.offsetWidth-15&&(n=window.innerWidth-s.width-10,this.isSidebar=!0,this.side="right"),this.element.style.transition="all 0.5s cubic-bezier(0.19, 1, 0.22, 1)",this.element.style.left=`${n}px`,this.element.style.top=`${r}px`,this.isSidebar?(localStorage.setItem("cluaiz_snap_y",String(r)),localStorage.setItem("cluaiz_side",this.side)):localStorage.setItem("cluaiz_pos",JSON.stringify({x:n,y:r})),localStorage.setItem("cluaiz_mode",this.isSidebar?"sidebar":"floating"),this.isSidebar?window.dispatchEvent(new CustomEvent("cluaiz-sidebar-mode",{detail:{side:this.side}})):window.dispatchEvent(new CustomEvent("cluaiz-floating-mode"))};this.element.addEventListener("mousedown",t)}applyConfig(t){if(this.config=t,t.icon.type==="robot")this.element.innerHTML=E,this.initRobotElements();else{let e=t.icon.type,o=t.theme?.iconStyle||"solid",i=z[e];typeof i=="object"&&(i=i[o]),this.element.innerHTML=i||z.chat}if(this.initMouseTracking(),this.applyStyles(t),this.applyAnimations(t),this.currentUnreadCount>0){let e=this.currentUnreadCount;this.currentUnreadCount=0,this.toggleNotification(e)}}initRobotElements(){this.botElements={body:document.getElementById("layer-body"),face:document.getElementById("layer-face"),features:document.getElementById("layer-features"),eyeGroupL:document.getElementById("eye-group-l"),eyeGroupR:document.getElementById("eye-group-r"),botWrapper:document.getElementById("bot-anim-wrapper")}}applyStyles(t){let e=this.element;if(t.position&&!this.isSidebar){let a=t.position.horizontal||"right",s=t.position.vertical||"bottom",n=t.position.offsetX??20,r=t.position.offsetY??20;e.style.bottom=s==="bottom"?`${r}px`:"auto",e.style.top=s==="top"?`${r}px`:"auto",e.style.right=a==="right"?`${n}px`:"auto",e.style.left=a==="left"?`${n}px`:"auto"}if(this.isSidebar){let a=parseFloat(localStorage.getItem("cluaiz_snap_y")||"-1"),s=localStorage.getItem("cluaiz_side")||"right";a>=0&&(e.style.top=`${a}px`,e.style.bottom="auto",e.style.left=s==="left"?"10px":"auto",e.style.right=s==="right"?"10px":"auto")}else this.currentPos&&(e.style.left=`${this.currentPos.x}px`,e.style.top=`${this.currentPos.y}px`,e.style.right="auto",e.style.bottom="auto");if(t.icon.type==="robot")if(e.style.setProperty("--body-color",t.robot.bodyColor),e.style.setProperty("--cluaiz-primary-color",t.robot.bodyColor),e.style.setProperty("--eye-color",t.robot.eyeColor),e.style.setProperty("--lip-color",t.robot.lipColor),e.style.setProperty("--cheek-color",t.robot.cheekColor),e.style.setProperty("--ear-color",t.robot.earColor),e.style.setProperty("--eyebrow-color",t.robot.eyebrowColor),t.robot.useGradient){e.style.setProperty("--cluaiz-primary-color",t.robot.gradientColor1),e.style.setProperty("--gradient-color1",t.robot.gradientColor1),e.style.setProperty("--gradient-color2",t.robot.gradientColor2),e.style.setProperty("--gradient-angle",`${t.robot.gradientAngle}deg`),t.robot.animateGradient?e.classList.add("gradient-animated"):e.classList.remove("gradient-animated");let a=(t.robot.gradientAngle-90)*(Math.PI/180),s=50+40*Math.cos(a),n=50+40*Math.sin(a),r=50-40*Math.cos(a),c=50-40*Math.sin(a),d=document.getElementById("head-gradient");d&&(d.setAttribute("x1",`${s}%`),d.setAttribute("y1",`${n}%`),d.setAttribute("x2",`${r}%`),d.setAttribute("y2",`${c}%`))}else e.style.setProperty("--gradient-color1",t.robot.bodyColor),e.style.setProperty("--gradient-color2",t.robot.bodyColor),e.classList.remove("gradient-animated");else{let a=t.theme.primaryColor||"#3B82F6",s=t.theme.secondaryColor||a;e.style.setProperty("--cluaiz-primary-color",a),e.style.setProperty("--icon-color",t.theme.iconColor||"#FFFFFF"),e.style.setProperty("--icon-scale",String(t.theme.iconScale||1)),e.style.setProperty("--primary-color",a),e.style.setProperty("--secondary-color",s),e.style.setProperty("--gradient-color1",a),e.style.setProperty("--gradient-color2",s);let n=t.theme.iconStyle==="outline";e.style.setProperty("--icon-fill",n?"none":t.theme.iconColor||"#FFFFFF"),e.style.setProperty("--icon-stroke",n?t.theme.iconColor||"#FFFFFF":"none"),e.style.setProperty("--icon-stroke-width",n?"2px":"0px"),t.theme.showBox===!1?(e.style.setProperty("--box-bg","transparent"),e.style.setProperty("--box-shadow","none"),e.style.setProperty("--box-border","none")):(e.style.removeProperty("--box-bg"),e.style.removeProperty("--box-shadow"),e.style.removeProperty("--box-border"))}e.style.setProperty("--anim-speed",String(t.animation?.speed||1)),e.style.setProperty("--anim-intensity",String(t.animation?.intensity||1)),e.style.setProperty("--box-radius",`${t.theme.boxRadius}%`);let i={xs:"60px",sm:"75px",md:"90px",lg:"105px",xl:"120px"}[t.icon.size]||"90px";e.style.width=i,e.style.height=i}applyAnimations(t){let e=this.element;if(e.className="cluaiz-launcher",t.animation?.entrance&&(e.classList.add(`entrance-${t.animation.entrance}`),setTimeout(()=>e.classList.remove(`entrance-${t.animation.entrance}`),1500)),this.isSidebar?e.classList.add("cluaiz-snapped"):e.classList.remove("cluaiz-snapped"),e.classList.add(`box-anim-${t.theme.boxAnimation||"none"}`),e.classList.add(`icon-anim-${t.icon.type==="robot"?"none":t.animation.simple||"none"}`),t.icon.type==="robot"){let o=t.animation.robot||"float",i=this.botElements.botWrapper;i&&(i.className=`bot-container-anim robot-${o}`),this.startBlinking()}}startBlinking(){let t=()=>{this.element.querySelectorAll(".cluaiz-eye-blink").forEach(e=>{e.style.animation="none",e.offsetWidth,e.style.animation="bot-blink 0.6s ease-in-out"}),setTimeout(t,2e3+Math.random()*3e3)};setTimeout(t,2e3)}initInteractionListeners(){this.element.addEventListener("mouseenter",()=>{if(this.config){if(this.element.classList.add("is-hovered"),this.config.icon.type==="robot"){let e=this.config.behavior?.robot?.hover||"none";if(e!=="none"){let o={wave:"robot-wave 1s ease-in-out",surprise:"robot-peep 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",giggle:"robot-spin 0.8s linear"};o[e]&&this.botElements.botWrapper&&(this.botElements.botWrapper.style.animation=o[e])}}else{let e=this.config.behavior?.icon?.hover||"none";this.element.classList.remove("hover-effect-scale","hover-effect-tilt"),e==="scale"?this.element.classList.add("hover-effect-scale"):e==="tilt"?this.element.classList.add("hover-effect-tilt"):e==="bounce"?this.element.style.animation="icon-bounce 0.6s ease-in-out infinite":e==="pulse"&&(this.element.style.animation="icon-pulse 1.5s ease-in-out infinite")}(this.config.icon.type==="robot"||this.config.icon.type==="cluaiz3bairobot")&&this.notifyIframeHover(!0)}}),this.element.addEventListener("mouseleave",()=>{this.element.classList.remove("is-hovered"),this.element.style.animation="",this.botElements.botWrapper&&(this.botElements.botWrapper.style.animation=""),(this.config?.icon?.type==="robot"||this.config?.icon?.type==="cluaiz3bairobot")&&this.notifyIframeHover(!1)}),this.element.addEventListener("mousedown",()=>{if(!this.config)return;let e=this.config.icon.type==="robot",o=e?this.config.behavior?.robot?.click||"nod":this.config.behavior?.icon?.click||"none";o!=="none"&&this.element.classList.add("is-active"),this.handleInteraction(o,e)}),this.element.addEventListener("mouseup",()=>this.element.classList.remove("is-active"));let t=(e,o=!1)=>{if(this.isInteractionExpanded=e,e){this.element.style.transform="scale(4.5)",this.element.style.transformOrigin="center center",this.element.style.zIndex="999999",this.element.style.width="100px",this.element.style.height="100px",this.element.style.borderRadius="",this.element.style.transition="transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";let i=this.element.querySelector("iframe");i&&(i.style.pointerEvents="auto")}else{this.element.style.transform="",this.element.style.zIndex="2147483647",this.element.style.width="100px",this.element.style.height="100px",this.element.style.borderRadius="",this.element.style.transition="transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";let i=this.element.querySelector("iframe");i&&(i.style.pointerEvents="none")}o||document.querySelectorAll("iframe").forEach(i=>{i.contentWindow?.postMessage({type:"CLUAIZ_DOUBLE_CLICK",forceState:e},"*")})};window.addEventListener("message",e=>{if(e.data?.type==="CLUAIZ_MENU_STATE"){let o=!!e.data.isOpen;o!==this.isInteractionExpanded&&t(o,!0)}}),this.element.addEventListener("dblclick",e=>{e.preventDefault(),t(!this.isInteractionExpanded)}),this.element.addEventListener("contextmenu",e=>{e.preventDefault(),t(!this.isInteractionExpanded)})}handleInteraction(t,e){if(e){let o=this.element.querySelectorAll(".cluaiz-eye-blink");t==="jump"?x(this.botElements.botWrapper,"robot-bounce",500):t==="nod"?x(this.element.querySelector(".robot-body"),"bot-nod",600):t==="wink"&&o.length>=2?(o[1].style.transform="scaleY(0.1)",setTimeout(()=>{o[1].style.transform="scaleY(1)"},300)):t==="close-eyes"&&o.forEach(i=>{i.style.transform="scaleY(0.1)",setTimeout(()=>{i.style.transform="scaleY(1)"},400)})}else if(t==="ripple-burst"){let o=document.createElement("div");o.className="cluaiz-ripple",Object.assign(o.style,{position:"absolute",top:"50%",left:"50%",width:"100%",height:"100%",borderRadius:"50%",border:"3px solid rgba(255,255,255,0.9)",transform:"translate(-50%, -50%) scale(0.4)",opacity:"1",pointerEvents:"none",transition:"all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",boxShadow:"0 0 20px rgba(255,255,255,0.5)"}),this.element.appendChild(o),requestAnimationFrame(()=>{o.style.transform="translate(-50%, -50%) scale(2.8)",o.style.opacity="0",o.style.borderWidth="0px"}),setTimeout(()=>o.remove(),600)}else t==="shake"?x(this.element,"icon-shake",500):t==="flip"?x(this.element,"icon-flip",800):t==="pop"&&(this.element.style.transform="scale(0.85)",setTimeout(()=>{this.element.style.transform=""},150))}initMouseTracking(){this.mouseX=window.innerWidth/2,this.mouseY=window.innerHeight/2,document.addEventListener("mousemove",this.handleMouseMove,{passive:!0})}getScaling(){let e=({xs:60,sm:75,md:90,lg:105,xl:120}[this.config?.icon?.size||"md"]||90)/90;return{factor:e,bellSize:Math.round(42*e),iconSize:Math.round(22*e),badgeSize:Math.round(20*e),badgeFont:Math.round(11*e),offset:-Math.round(12*e)}}toggleNotification(t){this.currentUnreadCount=t;let e=this.config?.theme?.primaryColor||"#3B82F6",o=this.config?.position?.vertical!=="top",i=this.config?.position?.horizontal!=="left",a=this.getScaling();if(t>0){this.notificationIcon||(this.notificationIcon=document.createElement("div"),this.notificationIcon.className="cluaiz-notification-magnet",Object.assign(this.notificationIcon.style,{position:"absolute",[o?"top":"bottom"]:`${a.offset}px`,[i?"right":"left"]:`${a.offset}px`,width:`${a.bellSize}px`,height:`${a.bellSize}px`,borderRadius:"50%",backgroundColor:"white",boxShadow:`0 ${8*a.factor}px ${20*a.factor}px rgba(0,0,0,0.12), 0 0 ${15*a.factor}px ${e}25`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:"20",transition:"all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",animation:"cluaiz-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",border:"1.5px solid rgba(255,255,255,0.8)"}),this.notificationIcon.innerHTML=`<svg width="${a.iconSize}" height="${a.iconSize}" viewBox="0 0 24 24" fill="none" stroke="${e}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg><div class="cluaiz-bell-badge" style="position:absolute;top:-${Math.round(4*a.factor)}px;right:-${Math.round(4*a.factor)}px;background:${e};color:white;min-width:${a.badgeSize}px;height:${a.badgeSize}px;border-radius:${a.badgeSize/2}px;font-size:${a.badgeFont}px;font-weight:900;display:flex;align-items:center;justify-content:center;padding:0 ${Math.round(4*a.factor)}px;border:${2.3*a.factor}px solid white;box-shadow:0 ${4*a.factor}px ${12*a.factor}px ${e}40;font-family:'Inter',sans-serif;"></div>`,this.notificationIcon.onmouseenter=()=>{this.lastPreviewText&&this.showPreview(this.lastPreviewText,!0),this.notificationIcon.style.transform=`scale(1.2) rotate(${i?"12":"-12"}deg)`},this.notificationIcon.onmouseleave=()=>{this.notificationIcon.style.transform="scale(1)"},this.element.appendChild(this.notificationIcon));let s=this.notificationIcon.querySelector(".cluaiz-bell-badge");s&&(s.textContent=t>99?"99+":String(t),s.style.display="flex"),this.notificationIcon.style.display="flex",this.notificationIcon.style.transform="scale(1.25) rotate(-15deg)",setTimeout(()=>{this.notificationIcon&&(this.notificationIcon.style.transform="")},250)}else{this.notificationIcon&&(this.notificationIcon.remove(),this.notificationIcon=void 0),this.lastPreviewText="";let s=document.querySelector(".cluaiz-preview-bubble");s&&(s.style.opacity="0")}}showPreview(t,e=!1){if(!t)return;this.lastPreviewText=t;let o=document.querySelector(".cluaiz-preview-bubble");o&&o.remove();let i=document.createElement("div");i.className="cluaiz-preview-bubble";let a=this.config?.theme?.primaryColor||"#3B82F6",s=this.config?.position?.vertical!=="top",n=this.config?.position?.horizontal!=="left",r=this.getScaling(),c=this.element.getBoundingClientRect(),d=Math.round(20*r.factor),p=s?{bottom:`${window.innerHeight-c.top+d}px`}:{top:`${c.bottom+d}px`},l=n?{right:`${window.innerWidth-c.right+10}px`}:{left:`${c.left+10}px`},h=Math.round(24*r.factor),f=`${Math.round(14*r.factor)}px ${Math.round(18*r.factor)}px`;if(Object.assign(i.style,{position:"fixed",...p,...l,backgroundColor:"rgba(255,255,255,0.94)",backdropFilter:"blur(16px) saturate(200%)",color:"#1e293b",padding:f,borderRadius:`${h}px`,borderBottomRightRadius:s&&n?"4px":`${h}px`,borderBottomLeftRadius:s&&!n?"4px":`${h}px`,borderTopRightRadius:!s&&n?"4px":`${h}px`,borderTopLeftRadius:!s&&!n?"4px":`${h}px`,boxShadow:`0 ${20*r.factor}px ${40*r.factor}px -${10*r.factor}px rgba(0,0,0,0.15), 0 0 ${25*r.factor}px ${a}15`,fontSize:`${Math.round(14*r.factor)}px`,fontWeight:"600",maxWidth:`${Math.round(280*r.factor)}px`,zIndex:"2147483647",opacity:"0",transform:`translateY(${s?"20":"-20"}px) scale(0.9) rotate(${n?"-2":"2"}deg)`,transition:"all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",border:"1.5px solid rgba(255,255,255,0.7)",pointerEvents:"all",cursor:"pointer"}),i.innerHTML=`<div style="display:flex;align-items:center;gap:${Math.round(8*r.factor)}px;margin-bottom:${Math.round(8*r.factor)}px;"><div style="width:${Math.round(8*r.factor)}px;height:${Math.round(8*r.factor)}px;background:${a};border-radius:50%;animation:cluaiz-pulse 1.5s infinite;"></div><div style="color:${a};font-size:${Math.round(11*r.factor)}px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;">New Message</div></div><div style="line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;font-family:'Outfit',sans-serif;">${t}</div>`,i.onclick=()=>{this.element.click(),i.remove()},document.body.appendChild(i),requestAnimationFrame(()=>{i.style.opacity="1",i.style.transform="translateY(0) scale(1) rotate(0deg)"}),!e)setTimeout(()=>{i&&document.body.contains(i)&&(i.style.opacity="0",i.style.transform=`translateY(${s?"10":"-10"}px) scale(0.95)`,setTimeout(()=>i.remove(),500))},2e4);else{let m=()=>{i&&(i.style.opacity="0",i.style.transform=`translateY(${s?"8":"-8"}px) scale(0.98)`,setTimeout(()=>i.remove(),400))};this.notificationIcon?.addEventListener("mouseleave",m,{once:!0})}}};var w=class{constructor(t,e){this.iframe=null;this.resizer=null;this.handles={};this.isCollapsed=!1;this.orgId=t,this.launcher=e,this.currentWidth=parseInt(localStorage.getItem("cluaiz_width")||"380"),this.currentHeight=parseInt(localStorage.getItem("cluaiz_height")||"600"),this.side=localStorage.getItem("cluaiz_side")||"right",this.isSidebar=localStorage.getItem("cluaiz_mode")==="sidebar",this.isOpen=localStorage.getItem("cluaiz_is_open")==="true",this.initMessageListener()}toggle(t){this.isOpen=t!==void 0?t:!this.isOpen,this.isOpen?(this.iframe||this.createIframe(),this.iframe?.classList.add("cluaiz-visible"),localStorage.setItem("cluaiz_is_open","true"),this.isSidebar?(this.toggleSidebar(!0,this.side),this.collapseSidebar(!1)):this.updatePosition()):(localStorage.setItem("cluaiz_is_open","false"),this.isSidebar?this.collapseSidebar(!0):(this.iframe?.classList.remove("cluaiz-visible"),this.toggleSidebar(!1))),this.syncHandles(),this.isOpen&&setTimeout(()=>this.syncHandles(),300)}isChatOpen(){return this.isOpen}createIframe(){this.iframe=document.createElement("iframe"),this.iframe.id="cluaiz-iframe",this.iframe.setAttribute("allow","microphone; camera; clipboard-write;");let t=new URLSearchParams(window.location.search).get("auto_answer")==="1"?"&auto_answer=1":"";this.iframe.src=`http://localhost:3000/embed/chat?embed=1&orgId=${this.orgId}${t}`,this.iframe.onload=()=>{this.iframe?.contentWindow?.postMessage({type:"CLUAIZ_CONTEXT",url:window.location.href,title:document.title},"*"),setTimeout(()=>this.syncHandles(),100)},document.body.appendChild(this.iframe),this.resizer||this.createResizer(),this.updatePosition()}createResizer(){this.resizer=document.createElement("div"),this.resizer.id="cluaiz-resizer",this.resizer.innerHTML='<div id="cluaiz-resizer-handle"><svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg></div>',document.body.appendChild(this.resizer);let t=this.resizer.querySelector("#cluaiz-resizer-handle");t.onclick=e=>{e.stopPropagation(),this.collapseSidebar(!0)},this.handles={r:this.createHandle("cluaiz-resizer-r"),l:this.createHandle("cluaiz-resizer-l"),t:this.createHandle("cluaiz-resizer-t"),b:this.createHandle("cluaiz-resizer-b")},this.initResizing(t)}createHandle(t){let e=document.createElement("div");return e.className=`cluaiz-resizer ${t}`,e.style.display="none",document.body.appendChild(e),e}initResizing(t){let e=null,o=0,i=0,a=0,s=0,n=0,r=0,c=(l,h)=>{l.preventDefault(),e=h,o=l.clientX,i=l.clientY,a=this.currentWidth,s=this.currentHeight;let f=this.iframe.getBoundingClientRect();n=f.top,r=f.left,this.iframe.style.transition="none",this.iframe.style.pointerEvents="none",document.body.classList.add("cluaiz-resizing"),document.addEventListener("mousemove",d),document.addEventListener("mouseup",p)},d=l=>{if(!e)return;let h=l.clientX-o,f=l.clientY-i,m=window.innerWidth*.4,y=window.innerHeight*.95;if(e==="r")this.currentWidth=Math.max(320,Math.min(m,a+h));else if(e==="l"){let g=Math.max(320,Math.min(m,a-h));g!==this.currentWidth&&(this.currentWidth=g,this.isSidebar||(this.iframe.style.left=`${r+(a-g)}px`))}else if(!this.isSidebar&&e==="b")this.currentHeight=Math.max(300,Math.min(y,s+f));else if(!this.isSidebar&&e==="t"){let g=Math.max(300,Math.min(y,s-f));g!==this.currentHeight&&(this.currentHeight=g,this.iframe.style.top=`${n+(s-g)}px`)}this.isSidebar?this.applySidebarStyles():(this.iframe.style.width=`${this.currentWidth}px`,this.iframe.style.height=`${this.currentHeight}px`,this.syncHandles())},p=()=>{e=null,this.iframe.style.transition="",this.iframe.style.pointerEvents="all",document.body.classList.remove("cluaiz-resizing"),localStorage.setItem("cluaiz_width",String(this.currentWidth)),localStorage.setItem("cluaiz_height",String(this.currentHeight)),document.removeEventListener("mousemove",d),document.removeEventListener("mouseup",p)};this.handles.r.onmousedown=l=>c(l,"r"),this.handles.l.onmousedown=l=>c(l,"l"),this.handles.t.onmousedown=l=>c(l,"t"),this.handles.b.onmousedown=l=>c(l,"b"),this.resizer.onmousedown=l=>{l.target===t||t.contains(l.target)||c(l,this.side==="right"?"l":"r")}}syncHandles(){if(!this.iframe||this.isSidebar||!this.isOpen){Object.values(this.handles).forEach(i=>i.style.display="none");return}let t=this.iframe.getBoundingClientRect(),e=4,o=22;Object.assign(this.handles.r.style,{display:"block",left:`${t.right-e}px`,top:`${t.top+o}px`,height:`${t.height-o*2}px`,width:`${e*2}px`}),Object.assign(this.handles.l.style,{display:"block",left:`${t.left-e}px`,top:`${t.top+o}px`,height:`${t.height-o*2}px`,width:`${e*2}px`}),Object.assign(this.handles.t.style,{display:"block",top:`${t.top-e}px`,left:`${t.left+o}px`,width:`${t.width-o*2}px`,height:`${e*2}px`}),Object.assign(this.handles.b.style,{display:"block",top:`${t.bottom-e}px`,left:`${t.left+o}px`,width:`${t.width-o*2}px`,height:`${e*2}px`})}collapseSidebar(t){if(this.isCollapsed=t,t){this.isOpen=!1,localStorage.setItem("cluaiz_is_open","false"),this.iframe.classList.remove("cluaiz-visible"),this.iframe.style.transform=`translateX(${this.side==="right"?"100%":"-100%"})`,this.iframe.style.opacity="0",this.iframe.style.pointerEvents="none",this.resizer.classList.remove("active"),document.body.classList.remove("cluaiz-squeezed"),document.body.style.paddingRight="0",document.body.style.paddingLeft="0";let e=this.launcher.element;e.style.transition="opacity 0.25s ease",e.style.opacity="1",e.style.pointerEvents="all"}else{this.iframe.style.transform="none",this.iframe.style.opacity="1",this.iframe.style.pointerEvents="all",this.resizer.classList.add("active"),document.body.classList.add("cluaiz-squeezed"),this.applySidebarStyles();let e=this.launcher.element;e.style.transition="opacity 0.25s ease",e.style.opacity="0",e.style.pointerEvents="none"}}updatePosition(){if(!this.iframe||this.isSidebar)return;let t=this.launcher.element.getBoundingClientRect(),e=this.currentWidth,o=this.currentHeight,i=12,a=10;this.iframe.style.width=`${e}px`,this.iframe.style.height=`${o}px`;let s=window.innerWidth-t.right,n=t.left,r;s>=e+i+a?r=t.right+i:n>=e+i+a?r=t.left-e-i:r=Math.max(a,Math.min(window.innerWidth-e-a,t.left+t.width/2-e/2));let c=t.bottom-o;c<a&&(c=a),c+o>window.innerHeight-a&&(c=window.innerHeight-o-a),this.iframe.style.left=`${r}px`,this.iframe.style.top=`${c}px`,this.iframe.style.right="auto",this.iframe.style.bottom="auto",this.syncHandles()}toggleSidebar(t,e="right"){this.iframe&&(this.isSidebar=t,this.side=e,t&&this.isOpen?(this.iframe.classList.add("cluaiz-sidebar-mode"),this.collapseSidebar(!1)):(this.iframe.classList.remove("cluaiz-sidebar-mode"),this.resizer&&this.resizer.classList.remove("active"),document.body.classList.remove("cluaiz-squeezed"),document.body.style.paddingRight="0",document.body.style.paddingLeft="0",this.iframe.style.width="380px",this.iframe.style.height="600px",this.iframe.style.transform="none",this.iframe.style.opacity="",this.iframe.style.pointerEvents="",this.updatePosition(),this.iframe.style.borderRadius="24px"))}applySidebarStyles(){if(!this.iframe||!this.resizer)return;let t=this.currentWidth+"px";this.iframe.style.width=t,this.iframe.style.height="100vh",this.iframe.style.top="0",this.iframe.style.bottom="auto",this.iframe.style.borderRadius="0";let e=this.resizer.querySelector("svg");this.side==="right"?(this.iframe.style.right="0",this.iframe.style.left="auto",this.resizer.style.right=t,this.resizer.style.left="auto",this.resizer.style.top="0",this.resizer.style.height="100vh",document.body.style.paddingRight=t,document.body.style.paddingLeft="0",e&&(e.style.transform="rotate(180deg)")):(this.iframe.style.left="0",this.iframe.style.right="auto",this.resizer.style.left=t,this.resizer.style.right="auto",this.resizer.style.top="0",this.resizer.style.height="100vh",document.body.style.paddingLeft=t,document.body.style.paddingRight="0",e&&(e.style.transform="rotate(0deg)"))}initMessageListener(){window.addEventListener("message",t=>{t.data==="CLUAIZ_CLOSE"&&this.toggle(!1),t.data.type==="CLUAIZ_SIDEBAR_TOGGLE"&&(this.isSidebar=t.data.enabled,localStorage.setItem("cluaiz_mode",this.isSidebar?"sidebar":"floating"),this.toggleSidebar(this.isSidebar,"right")),t.data.type==="CLUAIZ_READING"&&document.querySelectorAll("iframe").forEach(e=>{e.contentWindow&&e.contentWindow.postMessage({type:"CLUAIZ_READING",isReading:t.data.isReading},"*")})}),window.addEventListener("cluaiz-sidebar-mode",t=>{this.isSidebar=!0,this.side=t.detail?.side||"right",localStorage.setItem("cluaiz_side",this.side),this.isOpen&&this.iframe&&this.iframe.classList.contains("cluaiz-visible")&&this.toggleSidebar(!0,this.side)}),window.addEventListener("cluaiz-floating-mode",()=>{this.isSidebar=!1,this.toggleSidebar(!1)})}};(function(){"use strict";let u=document.createElement("style");u.innerHTML=S,document.head.appendChild(u);let t=document.querySelector("script[data-org-id]"),e=new URLSearchParams(window.location.search),o=t?.getAttribute("data-org-id")||window.CLUAIZ_ORG_ID||e.get("orgId")||"6923215949f85ef492c77fdb",i=new v,a=new w(o,i),s=new b(o,d=>{let p=d.widgetConfig||d;p.icon&&p.theme&&(i.applyConfig(p),a.updatePosition())});s.fetchConfig(),s.startHeartbeat(),s.initEventListeners();let n=parseInt(localStorage.getItem("cluaiz_unread_count")||"0"),r=localStorage.getItem("cluaiz_last_msg")||"";n>0&&setTimeout(()=>{i.toggleNotification(n),r&&i.showPreview(r)},1500),window.addEventListener("message",d=>{if(d.data.type,d.data.type==="CLUAIZ_NEW_MESSAGE"&&!a.isChatOpen()){n+=d.data.count||1,r=d.data.text||r,localStorage.setItem("cluaiz_unread_count",String(n)),localStorage.setItem("cluaiz_last_msg",r),i.toggleNotification(n),d.data.text&&i.showPreview(d.data.text);try{let p=new Audio("https://cdn.freesound.org/previews/536/536108_11532476-lq.mp3");p.volume=.5,p.play().catch(()=>{})}catch{}}});let c=null;i.element.addEventListener("click",()=>{if(i.clickWasDrag){i.clickWasDrag=!1;return}if(c){clearTimeout(c),c=null;return}c=setTimeout(()=>{a.toggle(),a.isChatOpen()&&(n=0,r="",localStorage.removeItem("cluaiz_unread_count"),localStorage.removeItem("cluaiz_last_msg"),i.toggleNotification(0),setTimeout(()=>a.updatePosition(),50)),c=null},220)}),window.addEventListener("storage",d=>{d.key==="cluaiz-widget-config"&&s.fetchConfig()}),a.isSidebar&&a.isOpen&&a.toggle(!0),console.log("\u2705 Cluaiz Modular Widget Ready!")})();})();
