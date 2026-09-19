/* ==========================================================================
   校园运动场馆信息系统 · 公共数据层（所有页面共用）
   暴露 window.SportsData：
     load(jsonPath)   加载并规整 JSON；file:// 直开或断网时回退内置数据
     levelOf(venue)   占用率级别
     statsOf(venue)   昨日总人流量、高峰时段
   数据规整兼容两种 hourlyFlow 写法：{hour,count} 与 [时段, 数值]。
   ========================================================================== */
(function (window) {
  'use strict';

  /* 兜底数据：file:// 双击打开时浏览器禁止 fetch 本地 JSON，
     使用这份与 data.json 一致的内置数据，保证功能可用、Console 无报错。 */
  var FALLBACK = {
    date: '2026-09-18（内置示例）',
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
    ]
  };

  // 场馆与 Bootstrap Icons 图标映射（供卡片渲染使用）
  var ICONS = {
    track: 'bi-flag-fill',
    basketball: 'bi-dribbble',
    badminton: 'bi-bullseye',
    volleyball: 'bi-circle-fill',
    tennis: 'bi-record-circle',
    swimming: 'bi-water'
  };

  function normalize(payload) {
    var list = payload && payload.venues ? payload.venues : [];
    return list.map(function (v) {
      return {
        id: v.id,
        name: v.name || '未命名场馆',
        type: v.type || '—',
        capacity: Math.max(1, Number(v.capacity) || 0),
        current: Number(v.current) || 0,
        openHours: v.openHours || '—',
        icon: ICONS[v.id] || 'bi-geo-alt-fill',
        hourlyFlow: (v.hourlyFlow || []).map(function (row) {
          // 兼容 {hour,count} 对象与 [时段,数值] 数组两种写法
          var hour = Object.prototype.toString.call(row) === '[object Array]' ? row[0] : row.hour;
          var count = Object.prototype.toString.call(row) === '[object Array]' ? row[1] : row.count;
          return { hour: String(hour), count: Number(count) || 0 };
        })
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
          venues: normalize(payload),
          meta: {
            date: payload.date || '—',
            source: payload.source || url + '（课堂演示模拟数据）',
            offline: false
          }
        };
      })
      .catch(function (err) {
        // file:// 直开或断网时走兜底（warn 是提示不是报错）
        console.warn('[运动场馆] JSON 读取失败，改用内置示例数据：', err.message);
        return {
          venues: normalize(FALLBACK),
          meta: { date: FALLBACK.date, source: FALLBACK.source, offline: true }
        };
      });
  }

  // 拥挤级别：<60% 空闲，60%-85% 适中，>85% 拥挤
  function levelOf(venue) {
    var rate = venue.current / venue.capacity;
    if (rate < 0.6) {
      return { key: 'ok', text: '空闲', badge: 'text-bg-success' };
    }
    if (rate <= 0.85) {
      return { key: 'warn', text: '适中', badge: 'text-bg-warning' };
    }
    return { key: 'busy', text: '拥挤', badge: 'text-bg-danger' };
  }

  // 昨日统计：总人流量与高峰时段（人数相同时取最早时段）
  function statsOf(venue) {
    var total = 0;
    var peakHour = '—';
    var peakCount = 0;

    venue.hourlyFlow.forEach(function (row) {
      total += row.count;
      if (row.count > peakCount) {
        peakCount = row.count;
        peakHour = row.hour;
      }
    });

    return { total: total, peakHour: peakHour, peakCount: peakCount };
  }

  window.SportsData = {
    load: load,
    levelOf: levelOf,
    statsOf: statsOf,
    icons: ICONS
  };
})(window);
