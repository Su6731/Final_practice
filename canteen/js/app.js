/* ==========================================================================
   校园食堂信息系统 · 交互逻辑
   分层约定：data（数据处理，原生 JS） / render（渲染） / bindEvents（事件）
   DOM 查询与事件统一用 jQuery，数据处理用原生 JS，不在同一处混写。
   第一次提交：实时总览与模拟刷新；图表在第二次提交加入。
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
  var FALLBACK_CANTEENS = [
    {
      id: 'pinwei', name: '品味堂', capacity: 850, current: 536, hours: '06:30 - 20:30',
      hourlyFlow: [[ '06:00', 88 ], [ '07:00', 312 ], [ '08:00', 265 ], [ '09:00', 120 ], [ '10:00', 95 ],
        [ '11:00', 560 ], [ '12:00', 610 ], [ '13:00', 280 ], [ '14:00', 110 ], [ '15:00', 105 ],
        [ '16:00', 150 ], [ '17:00', 430 ], [ '18:00', 470 ], [ '19:00', 210 ], [ '20:00', 90 ]],
      shops: [
        { name: '麻辣香锅', flow: 486 }, { name: '黄焖鸡米饭', flow: 402 }, { name: '自选快餐', flow: 371 },
        { name: '兰州拉面', flow: 288 }, { name: '脆皮鸡饭', flow: 235 }, { name: '鲜果饮品吧', flow: 176 }
      ]
    },
    {
      id: 'yuwei', name: '余味堂', capacity: 620, current: 418, hours: '06:30 - 20:00',
      hourlyFlow: [[ '06:00', 60 ], [ '07:00', 205 ], [ '08:00', 240 ], [ '09:00', 98 ], [ '10:00', 88 ],
        [ '11:00', 420 ], [ '12:00', 530 ], [ '13:00', 445 ], [ '14:00', 130 ], [ '15:00', 96 ],
        [ '16:00', 120 ], [ '17:00', 330 ], [ '18:00', 380 ], [ '19:00', 185 ], [ '20:00', 70 ]],
      shops: [
        { name: '大盘鸡拌面', flow: 377 }, { name: '铁板烧', flow: 342 }, { name: '麻辣烫', flow: 318 },
        { name: '石锅拌饭', flow: 254 }, { name: '鲜果捞', flow: 149 }
      ]
    },
    {
      id: 'zhiwei', name: '知味堂', capacity: 700, current: 302, hours: '06:30 - 21:00',
      hourlyFlow: [[ '06:00', 72 ], [ '07:00', 240 ], [ '08:00', 180 ], [ '09:00', 86 ], [ '10:00', 76 ],
        [ '11:00', 380 ], [ '12:00', 450 ], [ '13:00', 230 ], [ '14:00', 105 ], [ '15:00', 88 ],
        [ '16:00', 140 ], [ '17:00', 490 ], [ '18:00', 520 ], [ '19:00', 260 ], [ '20:00', 85 ]],
      shops: [
        { name: '东北水饺', flow: 396 }, { name: '烧腊饭', flow: 351 }, { name: '螺蛳粉', flow: 309 },
        { name: '牛肉汤面', flow: 227 }, { name: '轻食沙拉', flow: 158 }
      ]
    }
  ];

  // 页面运行状态统一收口，避免散落的全局变量
  var state = {
    canteens: [],
    simulateTimer: null,
    simulating: false,
    charts: { flow: null, shop: null } // ECharts 实例：同一容器只 init 一次，防止叠影
  };

  /* ========================================================================
     data：数据加载、规整与模拟（原生 JS）
     ======================================================================== */
  var data = {
    normalize: function (payload) {
      var list = payload && payload.canteens ? payload.canteens : [];
      return list.map(function (c) {
        return {
          id: c.id,
          name: c.name || '未命名食堂',
          capacity: Math.max(1, Number(c.capacity) || 0),
          current: Number(c.current) || 0,
          hours: c.hours || '—',
          hourlyFlow: (c.hourlyFlow || []).map(function (row) {
            return { hour: String(row.hour), count: Number(row.count) || 0 };
          }),
          shops: (c.shops || []).map(function (s) {
            return { name: s.name, flow: Number(s.flow) || 0 };
          })
        };
      });
    },

    load: function () {
      return fetch('data/data.json', { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) {
            throw new Error('HTTP ' + res.status);
          }
          return res.json();
        })
        .then(function (payload) {
          return {
            canteens: data.normalize(payload),
            meta: {
              updatedTime: payload.updatedTime || '—',
              source: payload.source || 'data/data.json（课堂演示模拟数据）',
              offline: false
            }
          };
        })
        .catch(function (err) {
          // 离线或 file:// 直开时走兜底数据（warn 仅作提示，不是报错）
          console.warn('[食堂信息系统] data.json 读取失败，改用内置示例数据：', err.message);
          return {
            canteens: data.normalize({ canteens: FALLBACK_CANTEENS }),
            meta: {
              updatedTime: '—（内置示例）',
              source: '内置示例数据（建议用本地服务器打开以读取 data/data.json）',
              offline: true
            }
          };
        });
    },

    // 拥挤级别：<60% 空闲，60%-85% 适中，>85% 拥挤
    levelOf: function (canteen) {
      var rate = canteen.current / canteen.capacity;
      if (rate < 0.6) {
        return { key: 'ok', text: '空闲', badge: 'text-bg-success' };
      }
      if (rate <= 0.85) {
        return { key: 'warn', text: '适中', badge: 'text-bg-warning' };
      }
      return { key: 'busy', text: '拥挤', badge: 'text-bg-danger' };
    },

    // 实时模拟：按 ±3% 随机波动，限制在 [0, capacity]
    simulate: function () {
      state.canteens.forEach(function (c) {
        var delta = Math.round(c.capacity * (Math.random() * 0.06 - 0.03));
        c.current = Math.min(c.capacity, Math.max(0, c.current + delta));
      });
      render.overview();
    }
  };

  /* ========================================================================
     render：汇总条与食堂卡片（jQuery）
     ======================================================================== */
  function canteenCardHtml(c) {
    var level = data.levelOf(c);
    var rate = Math.round((c.current / c.capacity) * 100);

    return [
      '<div class="col-md-6 col-xl-4">',
      '  <div class="card canteen-card rate-' + level.key + '">',
      '    <div class="card-body">',
      '      <div class="canteen-head">',
      '        <h5 class="canteen-name"><i class="bi bi-shop me-1"></i>', c.name, '</h5>',
      '        <span class="badge level-badge ', level.badge, '">', level.text, '</span>',
      '      </div>',
      '      <div class="canteen-count">', c.current, ' <small>/ ', c.capacity, ' 人</small></div>',
      '      <div class="progress" role="progressbar" aria-valuenow="', rate,
      '" aria-valuemin="0" aria-valuemax="100" aria-label="', c.name, '占用率">',
      '        <div class="progress-bar" style="width:', rate, '%"></div>',
      '      </div>',
      '      <div class="d-flex justify-content-between text-muted small mt-1">',
      '        <span>占用率 ', rate, '%</span>',
      '        <span>开放时间 ', c.hours, '</span>',
      '      </div>',
      '      <p class="canteen-meta mb-0"><i class="bi bi-activity"></i>每 5 秒模拟刷新实时人数</p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  var render = {
    overview: function () {
      var current = 0;
      var capacity = 0;

      state.canteens.forEach(function (c) {
        current += c.current;
        capacity += c.capacity;
      });

      $('#campus-current').text(current.toLocaleString('zh-CN'));
      $('#campus-capacity').text(capacity.toLocaleString('zh-CN'));
      $('#campus-rate').text(capacity ? Math.round((current / capacity) * 100) + '%' : '—');

      $('#canteen-list').html(state.canteens.map(canteenCardHtml).join(''));
    },

    // 各食堂客流 Top1 门店卡片
    topShops: function () {
      var medalColors = ['#f1c40f', '#bdc3c7', '#cd7f32']; // 金/银/铜

      var html = state.canteens.map(function (c, i) {
        var sorted = c.shops.slice().sort(function (a, b) {
          return b.flow - a.flow;
        });
        var top = sorted[0];

        if (!top) {
          return [
            '<div class="col-md-4">',
            '  <div class="card top-shop-card h-100"><div class="card-body text-muted">',
            '    <i class="bi bi-inboxes me-1"></i>', c.name, '暂无门店客流数据',
            '  </div></div>',
            '</div>'
          ].join('');
        }

        var sortedHtml = sorted.slice(1, 4).map(function (s, j) {
          return [
            '<li class="list-group-item d-flex justify-content-between align-items-center">',
            '  <span><span class="rank-no rank-' + (j + 2) + '">', j + 2, '</span>', s.name, '</span>',
            '  <span class="text-muted">', s.flow, ' 人次</span>',
            '</li>'
          ].join('');
        }).join('');

        return [
          '<div class="col-md-4">',
          '  <div class="card top-shop-card h-100">',
          '    <div class="card-body">',
          '      <div class="d-flex justify-content-between align-items-center mb-2">',
          '        <h6 class="mb-0 top-shop-canteen"><i class="bi bi-shop me-1"></i>', c.name, '</h6>',
          '        <span class="top-medal" style="background:', medalColors[i % 3], '">',
          '          <i class="bi bi-trophy-fill"></i>',
          '        </span>',
          '      </div>',
          '      <div class="top-shop-name">', top.name, '</div>',
          '      <div class="top-shop-flow">当日客流 ', top.flow.toLocaleString('zh-CN'), ' 人次</div>',
          '    </div>',
          sorted ? '<ul class="list-group list-group-flush">' + sortedHtml + '</ul>' : '',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');

      $('#top-shops').html(html);
    },

    // 当日人流：三食堂分时段分组柱状图
    flowChart: function (meta) {
      if (!window.echarts || !document.getElementById('flow-chart')) {
        return;
      }

      var hours = state.canteens.length && state.canteens[0].hourlyFlow.length
        ? state.canteens[0].hourlyFlow.map(function (row) {
            return row.hour;
          })
        : [];
      var seriesColors = ['#d35400', '#27ae60', '#2980b9'];

      var series = state.canteens.map(function (c, i) {
        return {
          name: c.name,
          type: 'bar',
          barMaxWidth: 18,
          data: c.hourlyFlow.map(function (row) {
            return row.count;
          }),
          itemStyle: {
            color: seriesColors[i % seriesColors.length],
            borderRadius: [3, 3, 0, 0]
          }
        };
      });

      state.charts.flow = initChart('flow-chart', state.charts.flow, {
        title: {
          text: '三食堂当日分时段人流量',
          left: 'center',
          textStyle: { fontSize: 16, color: '#2c3e50' }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          valueFormatter: function (value) {
            return value + ' 人次';
          }
        },
        legend: { top: 32 },
        grid: { left: 16, right: 20, top: 76, bottom: 40, containLabel: true },
        xAxis: {
          type: 'category',
          data: hours,
          name: '时段',
          axisLabel: { color: '#7f8c8d' }
        },
        yAxis: {
          type: 'value',
          name: '人次/小时',
          axisLabel: { color: '#7f8c8d' },
          splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: series
      });

      $('#flow-source').text(meta.source);
    },

    // 各食堂 Top3 门店横向条形图
    shopChart: function () {
      if (!window.echarts || !document.getElementById('shop-chart')) {
        return;
      }

      var seriesColors = ['#d35400', '#27ae60', '#2980b9'];
      var categories = [];
      var series = state.canteens.map(function (c, i) {
        var top3 = c.shops.slice().sort(function (a, b) {
          return b.flow - a.flow;
        }).slice(0, 3);

        // 每个食堂占 3 行，倒序排列使第 1 名在最上方
        top3.slice().reverse().forEach(function (s) {
          categories.push(c.name + ' · ' + s.name);
        });

        return {
          name: c.name,
          type: 'bar',
          barMaxWidth: 16,
          stack: null,
          data: top3.slice().reverse().map(function (s) {
            return s.flow;
          }),
          itemStyle: {
            color: seriesColors[i % seriesColors.length],
            borderRadius: [0, 3, 3, 0]
          }
        };
      });

      // 三个系列共用同一 y 轴，但各自只在自己区间有值：其余区间补 null
      var per = 3;
      var aligned = series.map(function (s, i) {
        var data = [];
        for (var k = 0; k < state.canteens.length * per; k++) {
          data.push(k >= i * per && k < (i + 1) * per ? s.data[k - i * per] : null);
        }
        return {
          name: s.name,
          type: 'bar',
          barMaxWidth: 16,
          data: data,
          itemStyle: s.itemStyle
        };
      });

      state.charts.shop = initChart('shop-chart', state.charts.shop, {
        title: {
          text: '各食堂当日客流 Top3 门店',
          left: 'center',
          textStyle: { fontSize: 16, color: '#2c3e50' }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          valueFormatter: function (value) {
            return value === null ? '-' : value + ' 人次';
          }
        },
        legend: { top: 32 },
        grid: { left: 16, right: 48, top: 76, bottom: 24, containLabel: true },
        xAxis: {
          type: 'value',
          name: '人次',
          axisLabel: { color: '#7f8c8d' },
          splitLine: { lineStyle: { type: 'dashed' } }
        },
        yAxis: {
          type: 'category',
          data: categories,
          axisLabel: { color: '#54667a', fontSize: 11 }
        },
        series: aligned
      });
    },

    empty: function () {
      $('#canteen-list').empty();
      $('#canteen-empty').removeClass('d-none');
      $('#campus-current, #campus-capacity').text('0');
      $('#campus-rate').text('—');
    }
  };

  // 图表实例管理：同一容器只 init 一次，数据变化只 setOption；窗口缩放自适应
  function initChart(elementId, existed, option) {
    var chart = existed || window.echarts.init(document.getElementById(elementId));
    chart.setOption(option, true);
    return chart;
  }

  window.addEventListener('resize', function () {
    Object.keys(state.charts).forEach(function (key) {
      if (state.charts[key]) {
        state.charts[key].resize();
      }
    });
  });

  /* ========================================================================
     bindEvents：实时模拟开关（jQuery）
     ======================================================================== */
  function startSimulate() {
    if (state.simulateTimer) {
      return;
    }
    state.simulating = true;
    state.simulateTimer = window.setInterval(function () {
      data.simulate();
      render.updatedTime(new Date());
    }, 5000);

    $('#btn-simulate')
      .addClass('active')
      .attr('aria-pressed', 'true')
      .html('<i class="bi bi-pause-fill me-1"></i>暂停实时模拟');
  }

  function stopSimulate() {
    if (state.simulateTimer) {
      window.clearInterval(state.simulateTimer);
      state.simulateTimer = null;
    }
    state.simulating = false;

    $('#btn-simulate')
      .removeClass('active')
      .attr('aria-pressed', 'false')
      .html('<i class="bi bi-play-fill me-1"></i>恢复实时模拟');
  }

  function bindEvents() {
    $('#btn-simulate').on('click', function () {
      if (state.simulating) {
        stopSimulate();
      } else {
        startSimulate();
      }
    });
  }

  render.updatedTime = function (date) {
    var pad = function (n) {
      return String(n).padStart(2, '0');
    };
    $('#updated-time').text(
      pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
    );
  };

  /* ========================================================================
     初始化入口
     ======================================================================== */
  $(function () {
    $('#year').text(new Date().getFullYear());
    bindEvents();

    data.load().then(function (result) {
      if (!result.canteens.length) {
        render.empty(); // 空数据自查：fetch 成功但无食堂记录
        return;
      }
      state.canteens = result.canteens;
      render.overview();
      render.topShops();
      render.flowChart(result.meta);
      render.shopChart();
      startSimulate();
    });
  });
})();
