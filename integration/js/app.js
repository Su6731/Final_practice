/* ==========================================================================
   校园公共信息与数据展示中心 · 交互逻辑
   分层约定：data（数据处理，原生 JS） / render（渲染） / bindEvents（事件）
   DOM 查询与事件统一用 jQuery，数据处理用原生 JS，不在同一处混写。
   ========================================================================== */
(function () {
  'use strict';

  // jQuery 由 CDN 先于本脚本加载；加载失败（如断网）时交给断网提示条处理
  if (!window.jQuery) {
    var failBanner = document.getElementById('cdn-fail');
    if (failBanner) {
      failBanner.classList.remove('d-none');
    }
    return;
  }

  var $ = window.jQuery;

  /* 兜底数据：通过 file:// 直接双击打开时浏览器不允许 fetch 本地 JSON，
     此时使用这份与 data.json 一致的内置数据，保证功能可用、Console 无报错。 */
  var FALLBACK_ROOMS = [
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
  ];

  // 页面运行状态统一收口，避免散落的全局变量
  var state = {
    rooms: [],
    maxUsage: 0,
    chart: null // ECharts 实例：同一容器只初始化一次，防止叠影
  };

  /* ========================================================================
     data：数据加载与规整（原生 JS）
     ======================================================================== */
  var data = {
    normalize: function (payload) {
      var list = payload && payload.rooms && payload.rooms.length ? payload.rooms : FALLBACK_ROOMS;
      return list.map(function (room) {
        return {
          id: room.id,
          name: room.name,
          floor: Number(room.floor),
          seats: Number(room.seats),
          status: room.status === 'open' ? 'open' : 'closed',
          hours: room.hours || '—',
          usage: Number(room.usage) || 0
        };
      });
    },

    load: async function () {
      try {
        var res = await fetch('data/data.json', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        var payload = await res.json();
        return {
          rooms: data.normalize(payload),
          meta: {
            week: payload.week || '本周',
            source: payload.source || 'data/data.json（课堂演示模拟数据）',
            unit: payload.unit || '人次'
          }
        };
      } catch (err) {
        // 离线或 file:// 直开时走兜底数据（warn 仅作提示，不是报错）
        console.warn('[校园信息中心] data.json 读取失败，改用内置示例数据：', err.message);
        return {
          rooms: data.normalize({ rooms: FALLBACK_ROOMS }),
          meta: {
            week: '本周（内置示例）',
            source: '内置示例数据（建议用本地服务器打开以读取 data/data.json）',
            unit: '人次'
          }
        };
      }
    }
  };

  /* ========================================================================
     render：列表、汇总卡片与图表渲染（jQuery + ECharts）
     ======================================================================== */
  function roomCardHtml(room) {
    var isOpen = room.status === 'open';
    var percent = state.maxUsage ? Math.round((room.usage / state.maxUsage) * 100) : 0;
    var statusBadge = isOpen
      ? '<span class="badge text-bg-success">开放中</span>'
      : '<span class="badge text-bg-secondary">已关闭</span>';

    return [
      '<div class="col-md-6 col-xxl-4">',
      '  <div class="card room-card h-100' + (isOpen ? '' : ' is-closed') + '">',
      '    <div class="card-body">',
      '      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">',
      '        <h5 class="room-name mb-0">', room.name, '</h5>',
      statusBadge,
      '      </div>',
      '      <ul class="room-meta list-unstyled mb-3">',
      '        <li><i class="bi bi-signpost-split"></i>楼层：', room.floor, ' 层</li>',
      '        <li><i class="bi bi-people"></i>座位：', room.seats, ' 个</li>',
      '        <li><i class="bi bi-clock"></i>开放时间：', room.hours, '</li>',
      '      </ul>',
      '      <div class="usage-label">本周使用 ', room.usage, ' 人次</div>',
      '      <div class="progress usage-bar" role="progressbar" aria-valuenow="', percent,
      '" aria-valuemin="0" aria-valuemax="100">',
      '        <div class="progress-bar" style="width:', percent, '%"></div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  var render = {
    rooms: function (rooms) {
      $('#room-list').html(rooms.map(roomCardHtml).join(''));
      $('#room-count').text('共 ' + rooms.length + ' 间');
      $('#room-empty').toggleClass('d-none', rooms.length !== 0);
      $('#room-list').toggleClass('d-none', rooms.length === 0);
    },

    summary: function (rooms) {
      var openCount = rooms.filter(function (r) {
        return r.status === 'open';
      }).length;
      var totalUsage = rooms.reduce(function (sum, r) {
        return sum + r.usage;
      }, 0);
      var openRate = rooms.length ? Math.round((openCount / rooms.length) * 100) + '%' : '—';

      $('#stat-total').text(rooms.length);
      $('#stat-usage').text(totalUsage.toLocaleString('zh-CN'));
      $('#stat-open').text(openCount);
      $('#stat-rate').text(openRate);
    },

    chart: function (rooms, meta) {
      if (!window.echarts || !document.getElementById('usage-chart')) {
        return;
      }
      var el = document.getElementById('usage-chart');

      // 同一容器只 init 一次；数据变化时只 setOption，避免叠影
      if (!state.chart) {
        state.chart = window.echarts.init(el);
        window.addEventListener('resize', function () {
          state.chart.resize();
        });
      }

      state.chart.setOption({
        title: {
          text: '各自习室本周使用量',
          left: 'center',
          textStyle: { fontSize: 16, color: '#1f2d3d' }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          valueFormatter: function (value) {
            return value + ' ' + meta.unit;
          }
        },
        grid: { left: 20, right: 24, top: 56, bottom: 96, containLabel: true },
        xAxis: {
          type: 'category',
          data: rooms.map(function (r) {
            return r.name;
          }),
          axisLabel: { interval: 0, rotate: 28, color: '#54667a', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          name: '单位：' + meta.unit,
          nameTextStyle: { color: '#8aa0b4' },
          axisLabel: { color: '#8aa0b4' },
          splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: [{
          name: '本周使用量',
          type: 'bar',
          barMaxWidth: 36,
          data: rooms.map(function (r) {
            return r.usage;
          }),
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#1769aa' },
          label: { show: true, position: 'top', fontSize: 11, color: '#54667a' }
        }]
      }, true);

      $('#chart-source').text(meta.source);
      $('#chart-week').text(meta.week);
    }
  };

  /* ========================================================================
     bindEvents：筛选事件（jQuery）
     ======================================================================== */
  function getFilters() {
    return {
      floor: $('#filter-floor').val(),
      status: $('#filter-status').val()
    };
  }

  function applyFilters() {
    var filters = getFilters();
    var filtered = state.rooms.filter(function (room) {
      var floorOk = filters.floor === 'all' || String(room.floor) === filters.floor;
      var statusOk = filters.status === 'all' || room.status === filters.status;
      return floorOk && statusOk;
    });
    render.rooms(filtered); // 筛选即时生效（change 即触发）
  }

  function bindEvents() {
    $('#filter-floor, #filter-status').on('change', applyFilters);
    $('#filter-reset').on('click', function () {
      $('#filter-floor, #filter-status').val('all');
      applyFilters();
    });
  }

  /* ========================================================================
     初始化入口
     ======================================================================== */
  $(function () {
    $('#year').text(new Date().getFullYear());
    bindEvents();

    data.load().then(function (result) {
      state.rooms = result.rooms;
      state.maxUsage = result.rooms.reduce(function (max, r) {
        return Math.max(max, r.usage);
      }, 0);

      render.summary(result.rooms);
      render.chart(result.rooms, result.meta);
      applyFilters();
    });
  });
})();
