// icons.jsx — minimal stroke icons. 1.5px stroke, 18px box.

const Icon = ({ name, size = 18, stroke = 1.6, style: styleProp, ...rest }) => {
  const s = { width: size, height: size, flexShrink: 0, ...styleProp };
  const common = {
    viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round",
    ...rest,
    style: s,
  };
  const P = (d) => <svg {...common}><path d={d} /></svg>;
  switch (name) {
    case "dashboard":
      return <svg {...common}><rect x="3" y="3" width="7.5" height="9" rx="1.4"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.4"/><rect x="13.5" y="11" width="7.5" height="10" rx="1.4"/><rect x="3" y="15" width="7.5" height="6" rx="1.4"/></svg>;
    case "plans":
      return <svg {...common}><rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9h17"/><path d="M9 4v16"/></svg>;
    case "foods":
      return <svg {...common}><path d="M12 3v18"/><path d="M5 7c0-2 1.8-4 3.5-4S12 5 12 7v3c-2.5 0-4-1-4-3"/><path d="M19 7c0-2-1.8-4-3.5-4S12 5 12 7v3c2.5 0 4-1 4-3"/></svg>;
    case "presets":
      return <svg {...common}><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/><circle cx="18.5" cy="17" r="2.2"/></svg>;
    case "shopping":
      return <svg {...common}><path d="M4 5h2.2l1.6 11.2a2 2 0 0 0 2 1.8h7.5a2 2 0 0 0 2-1.7L20.5 9H7"/><circle cx="10" cy="20.5" r="1.2"/><circle cx="17" cy="20.5" r="1.2"/></svg>;
    case "search": return P("M11 19a8 8 0 1 1 5.7-2.3l3.8 3.8M11 19l-1-1");
    case "plus": return P("M12 5v14M5 12h14");
    case "minus": return P("M5 12h14");
    case "x": return P("M6 6l12 12M18 6L6 18");
    case "check": return P("M5 12.5l4.5 4.5L19 7");
    case "chev-d": return P("M6 9l6 6 6-6");
    case "chev-r": return P("M9 6l6 6-6 6");
    case "chev-l": return P("M15 6l-6 6 6 6");
    case "chev-u": return P("M6 15l6-6 6 6");
    case "arrow-l": return P("M19 12H5M11 6l-6 6 6 6");
    case "arrow-r": return P("M5 12h14M13 6l6 6-6 6");
    case "edit": return P("M4 20h4l11-11-4-4L4 16v4zM13.5 6.5l4 4");
    case "trash": return P("M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v7M14 11v7");
    case "star": return <svg {...common}><path d="M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6L12 17.3l-5.4 2.8 1-6L3.3 9.9l6-.9z"/></svg>;
    case "star-f": return <svg viewBox="0 0 24 24" style={s} fill="currentColor"><path d="M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6L12 17.3l-5.4 2.8 1-6L3.3 9.9l6-.9z"/></svg>;
    case "more": return P("M5 12h.01M12 12h.01M19 12h.01");
    case "menu": return P("M4 7h16M4 12h16M4 17h16");
    case "user": return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>;
    case "mail": return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/></svg>;
    case "lock": return <svg {...common}><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>;
    case "logout": return P("M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h11");
    case "copy": return <svg {...common}><rect x="9" y="9" width="11" height="11" rx="1.8"/><path d="M14 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3"/></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>;
    case "calendar": return <svg {...common}><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>;
    case "drag": return P("M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01");
    case "info": return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></svg>;
    case "alert": return <svg {...common}><path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.01"/></svg>;
    case "users": return <svg {...common}><circle cx="9" cy="9" r="3.4"/><path d="M3 19c1-3 3.4-5 6-5s5 2 6 5"/><circle cx="17" cy="10" r="2.6"/><path d="M16 14c2.5 0 4.5 1.8 5 5"/></svg>;
    case "link": return P("M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11 7M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L13 17");
    case "list": return P("M4 6h16M4 12h16M4 18h10");
    case "grid": return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/></svg>;
    case "flame": return <svg {...common}><path d="M12 3c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3-2-5 0-9z"/></svg>;
    case "bolt": return <svg {...common}><path d="M13 3 5 14h6l-1 7 8-11h-6z"/></svg>;
    case "leaf": return <svg {...common}><path d="M4 20c0-9 7-16 16-16 0 9-7 16-16 16z"/><path d="M4 20c4-4 8-8 14-12"/></svg>;
    case "drop": return <svg {...common}><path d="M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12z"/></svg>;
    case "scale": return <svg {...common}><path d="M6 4h12l-2 4H8z"/><path d="M12 8v12M5 20h14"/></svg>;
    case "filter": return P("M4 5h16l-6 8v6l-4-2v-4z");
    case "send": return P("M21 3 11 13M21 3l-7 18-3-8-8-3z");
    case "settings": return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V19a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1A2 2 0 1 1 4.4 15l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7L4.2 5.4A2 2 0 1 1 7 2.6l.1.1a1.6 1.6 0 0 0 1.7.3H9a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7V7a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>;
    case "sun": return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case "moon": return P("M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z");
    case "logo":
      // PORTIO mark — sliced disc / wedge
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M12 2.5 V 12 L 21 9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="1.4" fill="currentColor"/>
        </svg>
      );
    default: return null;
  }
};

window.Icon = Icon;
