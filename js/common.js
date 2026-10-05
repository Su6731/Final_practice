/* ==========================================================================
   校园公共信息与数据展示中心 · 公共数据层（所有页面共用）
   暴露 window.CampusData：
     load(jsonPath)   加载并规整 JSON；file:// 直开或断网时回退内置数据
     levelOf(item)    占用率级别（item 需含 current / capacity）
     statsOf(item)    昨日总人流量、高峰时段（item 需含 hourlyFlow）
   数据规整兼容两种 hourlyFlow 写法：{hour,count} 与 [时段, 数值]。
   ========================================================================== */
(function (window) {
  'use strict';

  /* 兜底数据：file:// 双击打开时浏览器禁止 fetch 本地 JSON，
     使用这份与 data/data.json 一致的内置数据，保证功能可用、Console 无报错。 */
  var FALLBACK = {
    date: '2026-10-04（内置示例）',
    week: '本周（内置示例）',
    unit: '人次',
    source: '内置示例数据（建议用本地服务器打开以读取 data/data.json）',
    venues: [
      { id: 'track', name: '操场', type: '室外', capacity: 500, current: 210, openHours: '05:30 - 22:00',
        hourlyFlow: [['06:00', 180], ['07:00', 240], ['08:00', 120], ['09:00', 60], ['10:00', 45], ['11:00', 55],
          ['12:00', 70], ['13:00', 40], ['14:00', 50], ['15:00', 80], ['16:00', 130], ['17:00', 210],
          ['18:00', 160], ['19:00', 260], ['20:00', 190], ['21:00', 90]] },
      { id: 'basketball', name: '篮球馆', type: '室内', capacity: 200, current: 156, openHours: '08:00 - 22:00',
        hourlyFlow: [['06:00', 0], ['07:00', 10], ['08:00', 45], ['09:00', 60], ['10:00', 55], ['11:00', 70],
          ['12:00', 95], ['13:00', 60], ['14:00', 50], ['15:00', 80], ['16:00', 120], ['17:00', 150],
          ['18:00', 175], ['19:00', 190], ['20:00', 165], ['21:00', 80]] },
      { id: 'badminton', name: '羽毛球馆', type: '室内', capacity: 120, current: 98, openHours: '08:00 - 22:00',
        hourlyFlow: [['06:00', 0], ['07:00', 20], ['08:00', 55], ['09:00', 70], ['10:00', 60], ['11:00', 50],
          ['12:00', 40], ['13:00', 35], ['14:00', 45], ['15:00', 60], ['16:00', 80], ['17:00', 95],
          ['18:00', 105], ['19:00', 110], ['20:00', 115], ['21:00', 70]] },
      { id: 'volleyball', name: '排球场', type: '室外', capacity: 100, current: 45, openHours: '08:00 - 21:00',
        hourlyFlow: [['06:00', 0], ['07:00', 15], ['08:00', 30], ['09:00', 25], ['10:00', 20], ['11:00', 35],
          ['12:00', 45], ['13:00', 20], ['14:00', 25], ['15:00', 40], ['16:00', 70], ['17:00', 90],
          ['18:00', 75], ['19:00', 60], ['20:00', 40], ['21:00', 20]] },
      { id: 'tennis', name: '网球场', type: '室外', capacity: 80, current: 30, openHours: '07:00 - 21:00',
        hourlyFlow: [['06:00', 10], ['07:00', 45], ['08:00', 50], ['09:00', 40], ['10:00', 30], ['11:00', 25],
          ['12:00', 20], ['13:00', 15], ['14:00', 25], ['15:00', 40], ['16:00', 60], ['17:00', 55],
          ['18:00', 45], ['19:00', 35], ['20:00', 25], ['21:00', 10]] },
      { id: 'swimming', name: '游泳馆', type: '室内', capacity: 260, current: 140, openHours: '09:00 - 21:30',
        hourlyFlow: [['06:00', 0], ['07:00', 0], ['08:00', 0], ['09:00', 60], ['10:00', 90], ['11:00', 110],
          ['12:00', 130], ['13:00', 95], ['14:00', 80], ['15:00', 100], ['16:00', 140], ['17:00', 170],
          ['18:00', 220], ['19:00', 200], ['20:00', 150], ['21:00', 70]] }
    ],
    canteens: [
      { id: 'pinwei', name: '品味堂', capacity: 850, current: 536, hours: '06:30 - 20:30',
        hourlyFlow: [['06:00', 88], ['07:00', 312], ['08:00', 265], ['09:00', 120], ['10:00', 95],
          ['11:00', 560], ['12:00', 610], ['13:00', 280], ['14:00', 110], ['15:00', 105],
          ['16:00', 150], ['17:00', 430], ['18:00', 470], ['19:00', 210], ['20:00', 90]],
        shops: [
          { name: '麻辣香锅', flow: 486 }, { name: '黄焖鸡米饭', flow: 402 }, { name: '自选快餐', flow: 371 },
          { name: '兰州拉面', flow: 288 }, { name: '脆皮鸡饭', flow: 235 }, { name: '鲜果饮品吧', flow: 176 }
        ] },
      { id: 'yuwei', name: '余味堂', capacity: 620, current: 418, hours: '06:30 - 20:00',
        hourlyFlow: [['06:00', 60], ['07:00', 205], ['08:00', 240], ['09:00', 98], ['10:00', 88],
          ['11:00', 420], ['12:00', 530], ['13:00', 445], ['14:00', 130], ['15:00', 96],
          ['16:00', 120], ['17:00', 330], ['18:00', 380], ['19:00', 185], ['20:00', 70]],
        shops: [
          { name: '大盘鸡拌面', flow: 377 }, { name: '铁板烧', flow: 342 }, { name: '麻辣烫', flow: 318 },
          { name: '石锅拌饭', flow: 254 }, { name: '鲜果捞', flow: 149 }
        ] },
      { id: 'zhiwei', name: '知味堂', capacity: 700, current: 302, hours: '06:30 - 21:00',
        hourlyFlow: [['06:00', 72], ['07:00', 240], ['08:00', 180], ['09:00', 86], ['10:00', 76],
          ['11:00', 380], ['12:00', 450], ['13:00', 230], ['14:00', 105], ['15:00', 88],
          ['16:00', 140], ['17:00', 490], ['18:00', 520], ['19:00', 260], ['20:00', 85]],
        shops: [
          { name: '东北水饺', flow: 396 }, { name: '烧腊饭', flow: 351 }, { name: '螺蛳粉', flow: 309 },
          { name: '牛肉汤面', flow: 227 }, { name: '轻食沙拉', flow: 158 }
        ] }
    ],
    rooms: [
      { id: 1, name: '图书馆一层自习室', floor: 1, seats: 120, status: 'open', hours: '08:00 - 22:00', usage: 860 },
      { id: 2, name: '博学楼101自习室', floor: 1, seats: 80, status: 'open', hours: '08:00 - 21:30', usage: 642 },
      { id: 3, name: '博学楼203自习室', floor: 2, seats: 60, status: 'open', hours: '08:00 - 21:30', usage: 515 },
      { id: 4, name: '慎思楼210自习室', floor: 2, seats: 45, status: 'closed', hours: '维护中，暂停开放', usage: 0 },
      { id: 5, name: '慎思楼305自习室', floor: 3, seats: 50, status: 'open', hours: '09:00 - 22:00', usage: 433 },
      { id: 6, name: '格物楼312自习室', floor: 3, seats: 72, status: 'open', hours: '08:30 - 22:00', usage: 690 },
      { id: 7, name: '格物楼401自习室', floor: 4, seats: 40, status: 'open', hours: '09:00 - 21:00', usage: 305 },
      { id: 8, name: '致远楼408考研自习室', floor: 4, seats: 64, status: 'open', hours: '07:30 - 23:00', usage: 781 },
      { id: 9, name: '图书馆二层静音舱', floor: 2, seats: 30, status: 'open', hours: '09:00 - 21:00', usage: 388 },
      { id: 10, name: '致知楼105自习室', floor: 1, seats: 56, status: 'closed', hours: '周末闭馆', usage: 146 }
    ]
  };

  // 运动场馆与 Bootstrap Icons 图标映射（供卡片渲染使用）
  var VENUE_ICONS = {
    track: 'bi-flag-fill',
    basketball: 'bi-dribbble',
    badminton: 'bi-bullseye',
    volleyball: 'bi-circle-fill',
    tennis: 'bi-record-circle',
    swimming: 'bi-water'
  };

  function normalizeFlow(rows) {
    return (rows || []).map(function (row) {
      var isArray = Object.prototype.toString.call(row) === '[object Array]';
      var hour = isArray ? row[0] : row.hour;
      var count = isArray ? row[1] : row.count;
      return { hour: String(hour), count: Number(count) || 0 };
    });
  }

  function normalizeVenues(payload) {
    var list = payload && payload.venues ? payload.venues : [];
    return list.map(function (v) {
      return {
        id: v.id,
        name: v.name || '未命名场馆',
        type: v.type || '—',
        capacity: Math.max(1, Number(v.capacity) || 0),
        current: Number(v.current) || 0,
        openHours: v.openHours || '—',
        icon: VENUE_ICONS[v.id] || 'bi-geo-alt-fill',
        hourlyFlow: normalizeFlow(v.hourlyFlow)
      };
    });
  }

  function normalizeCanteens(payload) {
    var list = payload && payload.canteens ? payload.canteens : [];
    return list.map(function (c) {
      return {
        id: c.id,
        name: c.name || '未命名食堂',
        capacity: Math.max(1, Number(c.capacity) || 0),
        current: Number(c.current) || 0,
        hours: c.hours || '—',
        icon: 'bi-shop',
        hourlyFlow: normalizeFlow(c.hourlyFlow),
        shops: (c.shops || []).map(function (s) {
          return { name: s.name || '未命名门店', flow: Number(s.flow) || 0 };
        })
      };
    });
  }

  function normalizeRooms(payload) {
    var list = payload && payload.rooms ? payload.rooms : [];
    return list.map(function (r) {
      return {
        id: r.id,
        name: r.name || '未命名自习室',
        floor: Number(r.floor) || 0,
        seats: Number(r.seats) || 0,
        status: r.status === 'closed' ? 'closed' : 'open',
        hours: r.hours || '—',
        icon: 'bi-book',
        usage: Number(r.usage) || 0
      };
    });
  }

  function load(jsonPath) {
    var url = jsonPath || 'data/data.json';
    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        return res.json();
      })
      .then(function (payload) {
        return {
          venues: normalizeVenues(payload),
          canteens: normalizeCanteens(payload),
          rooms: normalizeRooms(payload),
          meta: {
            date: payload.date || '—',
            week: payload.week || '本周',
            unit: payload.unit || '人次',
            source: payload.source || url + '（课堂演示模拟数据）',
            offline: false
          }
        };
      })
      .catch(function (err) {
        // file:// 直开或断网时走兜底（warn 是提示不是报错）
        console.warn('[校园信息中心] JSON 读取失败，改用内置示例数据：', err.message);
        return {
          venues: normalizeVenues(FALLBACK),
          canteens: normalizeCanteens(FALLBACK),
          rooms: normalizeRooms(FALLBACK),
          meta: { date: FALLBACK.date, week: FALLBACK.week, unit: FALLBACK.unit, source: FALLBACK.source, offline: true }
        };
      });
  }

  // 拥挤级别：<60% 空闲，60%-85% 适中，>85% 拥挤
  function levelOf(item) {
    var rate = item.capacity ? item.current / item.capacity : 0;
    if (rate < 0.6) {
      return { key: 'ok', text: '空闲', badge: 'text-bg-success', rate: rate };
    }
    if (rate <= 0.85) {
      return { key: 'warn', text: '适中', badge: 'text-bg-warning', rate: rate };
    }
    return { key: 'busy', text: '拥挤', badge: 'text-bg-danger', rate: rate };
  }

  // 昨日统计：总人流量与高峰时段（人数相同时取最早时段）
  function statsOf(item) {
    var total = 0;
    var peakHour = '—';
    var peakCount = 0;

    (item.hourlyFlow || []).forEach(function (row) {
      total += row.count;
      if (row.count > peakCount) {
        peakCount = row.count;
        peakHour = row.hour;
      }
    });

    return { total: total, peakHour: peakHour, peakCount: peakCount };
  }

  // 三维场景用：自习楼开放比例级别（>=80% 空闲资源充足，>=50% 适中，否则紧张）
  function ratioLevel(ratio) {
    if (ratio >= 0.8) {
      return { key: 'ok', text: '充足' };
    }
    if (ratio >= 0.5) {
      return { key: 'warn', text: '适中' };
    }
    return { key: 'busy', text: '紧张' };
  }

  window.CampusData = {
    load: load,
    levelOf: levelOf,
    statsOf: statsOf,
    ratioLevel: ratioLevel,
    venueIcons: VENUE_ICONS,
    fallback: FALLBACK
  };
})(window);
