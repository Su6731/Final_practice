/* ==========================================================================
   数据中心页：排行表格 + 七张 ECharts 图表
   运动：柱状图 / 折线图 / 饼图；食堂：分组柱状图 / 横向条形图；自习：柱状图 / 环形饼图
   同一容器只 init 一次，防止切换或重绘时叠影。
   ========================================================================== */
$(function () {
  'use strict';

  var PALETTE = ['#0e7c86', '#f97316', '#2563eb', '#16a34a', '#9333ea', '#dc2626'];
  var CANTEEN_COLORS = ['#d35400', '#27ae60', '#2980b9'];
  var charts = {};

  function initChart(id, option) {
    if (!charts[id]) {
      charts[id] = echarts.init(document.getElementById(id));
    }
    charts[id].setOption(option, true);
  }

  /* ------------------------------------------------------------------
     运动场馆：表格 + 柱状图 + 折线图 + 饼图
     ------------------------------------------------------------------ */
  function renderSports(venues) {
    var ranked = venues.map(function (v) {
      return $.extend({}, v, CampusData.statsOf(v));
    }).sort(function (a, b) {
      return b.total - a.total;
    });

    // 排行表格
    $('#rank-body').html(ranked.map(function (v, i) {
      var rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
      return [
        '<tr>',
        '  <td><span class="rank-no ' + rankClass + '">', i + 1, '</span></td>',
        '  <td class="text-start fw-semibold"><i class="bi ' + v.icon + ' me-1 text-primary"></i>', v.name, '</td>',
        '  <td>', v.type, '</td>',
        '  <td class="fw-semibold">', v.total.toLocaleString('zh-CN'), '</td>',
        '  <td><span class="peak-tag"><i class="bi bi-clock-history me-1"></i>', v.peakHour, '</span></td>',
        '  <td>', v.peakCount, '</td>',
        '</tr>'
      ].join('');
    }).join(''));

    // 图 1：总人流量柱状图
    initChart('chart-v-bar', {
      title: { text: '各场馆昨日总人流量排行', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
        valueFormatter: function (v) { return v + ' 人次'; } },
      grid: { left: 16, right: 24, top: 56, bottom: 40, containLabel: true },
      xAxis: { type: 'category', data: ranked.map(function (v) { return v.name; }),
        axisLabel: { color: '#54667a' } },
      yAxis: { type: 'value', name: '人次', axisLabel: { color: '#8a98a5' },
        splitLine: { lineStyle: { type: 'dashed' } } },
      series: [{
        name: '昨日总人流量',
        type: 'bar',
        barMaxWidth: 44,
        data: ranked.map(function (v, i) {
          return { value: v.total, itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: [5, 5, 0, 0] } };
        }),
        label: { show: true, position: 'top', color: '#54667a' }
      }]
    });

    // 图 2：分时段折线图
    var hours = venues.length ? venues[0].hourlyFlow.map(function (r) { return r.hour; }) : [];
    initChart('chart-v-line', {
      title: { text: '昨日分时段人流趋势', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis', valueFormatter: function (v) { return v + ' 人'; } },
      legend: { top: 30, type: 'scroll' },
      grid: { left: 12, right: 20, top: 72, bottom: 36, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: hours, axisLabel: { color: '#8a98a5' } },
      yAxis: { type: 'value', name: '人', axisLabel: { color: '#8a98a5' },
        splitLine: { lineStyle: { type: 'dashed' } } },
      series: venues.map(function (v, i) {
        return {
          name: v.name,
          type: 'line',
          smooth: true,
          symbolSize: 6,
          data: v.hourlyFlow.map(function (r) { return r.count; }),
          lineStyle: { width: 2, color: PALETTE[i % PALETTE.length] },
          itemStyle: { color: PALETTE[i % PALETTE.length] }
        };
      })
    });

    // 图 3：占比饼图
    initChart('chart-v-pie', {
      title: { text: '昨日人流量占比', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 人次（{d}%）' },
      legend: { bottom: 0, type: 'scroll' },
      color: PALETTE,
      series: [{
        name: '昨日总人流量',
        type: 'pie',
        radius: ['38%', '62%'],
        center: ['50%', '52%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%', fontSize: 11 },
        data: ranked.map(function (v) { return { name: v.name, value: v.total }; })
      }]
    });
  }

  /* ------------------------------------------------------------------
     食堂：分时段分组柱状图 + Top3 门店横向条形图
     ------------------------------------------------------------------ */
  function renderCanteens(canteens) {
    var hours = canteens.length ? canteens[0].hourlyFlow.map(function (r) { return r.hour; }) : [];

    // 图 4：分时段分组柱状图
    initChart('chart-c-bar', {
      title: { text: '三食堂昨日分时段客流量', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
        valueFormatter: function (v) { return v + ' 人次'; } },
      legend: { top: 30 },
      grid: { left: 16, right: 20, top: 72, bottom: 40, containLabel: true },
      xAxis: { type: 'category', data: hours, name: '时段', axisLabel: { color: '#7f8c8d' } },
      yAxis: { type: 'value', name: '人次/小时', axisLabel: { color: '#7f8c8d' },
        splitLine: { lineStyle: { type: 'dashed' } } },
      series: canteens.map(function (c, i) {
        return {
          name: c.name,
          type: 'bar',
          barMaxWidth: 18,
          data: c.hourlyFlow.map(function (r) { return r.count; }),
          itemStyle: { color: CANTEEN_COLORS[i % CANTEEN_COLORS.length], borderRadius: [3, 3, 0, 0] }
        };
      })
    });

    // 图 5：各食堂 Top3 门店横向条形图（三个系列按区间补 null 对齐）
    var categories = [];
    var rawSeries = canteens.map(function (c, i) {
      var top3 = c.shops.slice().sort(function (a, b) { return b.flow - a.flow; }).slice(0, 3);
      top3.slice().reverse().forEach(function (s) {
        categories.push(c.name + ' · ' + s.name);
      });
      return {
        name: c.name,
        values: top3.slice().reverse().map(function (s) { return s.flow; }),
        color: CANTEEN_COLORS[i % CANTEEN_COLORS.length]
      };
    });

    var per = 3;
    var aligned = rawSeries.map(function (s, i) {
      var data = [];
      for (var k = 0; k < canteens.length * per; k++) {
        data.push(k >= i * per && k < (i + 1) * per ? s.values[k - i * per] : null);
      }
      return {
        name: s.name,
        type: 'bar',
        barMaxWidth: 16,
        data: data,
        itemStyle: { color: s.color, borderRadius: [0, 3, 3, 0] }
      };
    });

    initChart('chart-c-shop', {
      title: { text: '各食堂昨日客流 Top3 门店', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
        valueFormatter: function (v) { return v === null || v === undefined ? '-' : v + ' 人次'; } },
      legend: { top: 30 },
      grid: { left: 16, right: 48, top: 72, bottom: 24, containLabel: true },
      xAxis: { type: 'value', name: '人次', axisLabel: { color: '#7f8c8d' },
        splitLine: { lineStyle: { type: 'dashed' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#54667a', fontSize: 11 } },
      series: aligned
    });
  }

  /* ------------------------------------------------------------------
     自习室：使用量柱状图 + 开放状态环形饼图
     ------------------------------------------------------------------ */
  function renderRooms(rooms, unit) {
    // 图 6：本周使用量柱状图（关闭的自习室用灰色）
    initChart('chart-r-bar', {
      title: { text: '各自习室本周使用量', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
        valueFormatter: function (v) { return v + ' ' + unit; } },
      grid: { left: 20, right: 24, top: 56, bottom: 104, containLabel: true },
      xAxis: {
        type: 'category',
        data: rooms.map(function (r) { return r.name; }),
        axisLabel: { interval: 0, rotate: 30, color: '#54667a', fontSize: 11 }
      },
      yAxis: { type: 'value', name: '单位：' + unit, axisLabel: { color: '#8aa0b4' },
        splitLine: { lineStyle: { type: 'dashed' } } },
      series: [{
        name: '本周使用量',
        type: 'bar',
        barMaxWidth: 34,
        data: rooms.map(function (r) {
          return {
            value: r.usage,
            itemStyle: {
              color: r.status === 'open' ? '#0e7c86' : '#9aa3ab',
              borderRadius: [4, 4, 0, 0]
            }
          };
        }),
        label: { show: true, position: 'top', fontSize: 11, color: '#54667a' }
      }]
    });

    // 图 7：开放 / 关闭数量环形饼图
    var openCount = rooms.filter(function (r) { return r.status === 'open'; }).length;
    var closedCount = rooms.length - openCount;
    initChart('chart-r-pie', {
      title: { text: '自习室开放状态', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 间（{d}%）' },
      legend: { bottom: 0 },
      color: ['#16a34a', '#9aa3ab'],
      series: [{
        name: '开放状态',
        type: 'pie',
        radius: ['42%', '66%'],
        center: ['50%', '52%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{c} 间', fontSize: 12 },
        data: [
          { name: '开放中', value: openCount },
          { name: '已关闭', value: closedCount }
        ]
      }]
    });
  }

  CampusData.load('data/data.json').then(function (result) {
    $('#stat-date').text(result.meta.date);
    $('#stat-week').text(result.meta.week);
    $('#stat-source').text(result.meta.source);

    if (result.venues.length) {
      renderSports(result.venues);
    } else {
      $('#sports-empty').removeClass('d-none');
    }

    if (result.canteens.length) {
      renderCanteens(result.canteens);
    } else {
      $('#canteen-empty').removeClass('d-none');
    }

    if (result.rooms.length) {
      renderRooms(result.rooms, result.meta.unit);
    } else {
      $('#rooms-empty').removeClass('d-none');
    }
  });

  // 窗口缩放时所有图表自适应
  window.addEventListener('resize', function () {
    Object.keys(charts).forEach(function (key) {
      if (charts[key]) {
        charts[key].resize();
      }
    });
  });
});
