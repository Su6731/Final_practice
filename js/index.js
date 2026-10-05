/* ==========================================================================
   首页：汇总条 + 三业态（场馆 / 食堂 / 自习室）选项卡卡片渲染（jQuery）
   ========================================================================== */
$(function () {
  'use strict';

  $('#year').text(new Date().getFullYear());

  // 占用率卡片（场馆 / 食堂通用）
  function occupancyCardHtml(item, col) {
    var level = CampusData.levelOf(item);
    var rate = Math.round(level.rate * 100);

    return [
      '<div class="col-sm-6 ' + col + '">',
      '  <div class="card service-card rate-' + level.key + '">',
      '    <div class="card-body">',
      '      <div class="service-head">',
      '        <h5 class="service-name"><span class="service-icon"><i class="bi ' + item.icon + '"></i></span>', item.name, '</h5>',
      '        <span class="badge level-badge ' + level.badge + '">', level.text, '</span>',
      '      </div>',
      '      <div class="service-count">', item.current, ' <small>/ ', item.capacity, ' 人</small></div>',
      '      <div class="progress mt-2" role="progressbar" aria-valuenow="', rate,
      '" aria-valuemin="0" aria-valuemax="100" aria-label="', item.name, '占用率">',
      '        <div class="progress-bar" style="width:', rate, '%"></div>',
      '      </div>',
      '      <p class="service-meta mb-0">',
      item.openHours
        ? '<i class="bi bi-clock"></i>' + item.openHours + '<span class="ms-3"><i class="bi bi-geo-alt"></i>' + item.type + '</span>'
        : '<i class="bi bi-clock"></i>' + item.hours,
      '        <span class="ms-3">占用率 ', rate, '%</span></p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  // 自习室卡片：开放状态 + 座位 + 本周使用量
  function roomCardHtml(room, maxUsage) {
    var isOpen = room.status === 'open';
    var percent = maxUsage ? Math.round((room.usage / maxUsage) * 100) : 0;
    var badge = isOpen
      ? '<span class="badge level-badge text-bg-success">开放中</span>'
      : '<span class="badge level-badge text-bg-secondary">已关闭</span>';

    return [
      '<div class="col-sm-6 col-xl-4">',
      '  <div class="card service-card' + (isOpen ? '' : ' is-closed') + '">',
      '    <div class="card-body">',
      '      <div class="service-head">',
      '        <h5 class="service-name"><span class="service-icon"><i class="bi ' + room.icon + '"></i></span>', room.name, '</h5>',
      badge,
      '      </div>',
      '      <div class="service-count">', room.seats, ' <small>个座位</small></div>',
      '      <div class="progress mt-2" role="progressbar" aria-valuenow="', percent,
      '" aria-valuemin="0" aria-valuemax="100" aria-label="', room.name, '本周使用量占比">',
      '        <div class="progress-bar" style="width:', percent, '%"></div>',
      '      </div>',
      '      <div class="room-tags">',
      '        <span class="room-tag"><i class="bi bi-signpost-split me-1"></i>', room.floor, ' 层</span>',
      '        <span class="room-tag"><i class="bi bi-people me-1"></i>本周 ', room.usage.toLocaleString('zh-CN'), ' 人次</span>',
      '      </div>',
      '      <p class="service-meta mb-0"><i class="bi bi-clock"></i>', room.hours, '</p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  CampusData.load('data/data.json').then(function (result) {
    var hasData = result.venues.length || result.canteens.length || result.rooms.length;
    if (!hasData) {
      $('#data-empty').removeClass('d-none');
      $('#sum-current, #sum-capacity, #mini-venues, #mini-canteens, #mini-rooms').text('0');
      $('#sum-rate').text('—');
      $('#sum-rooms').text('0');
      return;
    }

    // 顶部汇总：场馆 + 食堂的当前人数 / 容量；自习室开放数
    var current = 0;
    var capacity = 0;
    result.venues.concat(result.canteens).forEach(function (item) {
      current += item.current;
      capacity += item.capacity;
    });
    var openRooms = result.rooms.filter(function (r) { return r.status === 'open'; });

    $('#sum-current').text(current.toLocaleString('zh-CN'));
    $('#sum-capacity').text(capacity.toLocaleString('zh-CN'));
    $('#sum-rate').text(capacity ? Math.round((current / capacity) * 100) + '%' : '—');
    $('#sum-rooms').text(openRooms.length + ' / ' + result.rooms.length);

    $('#mini-venues').text(result.venues.length);
    $('#mini-canteens').text(result.canteens.length);
    $('#mini-rooms').text(result.rooms.length);
    $('#mini-date').text(result.meta.date);

    // 三个选项卡面板
    $('#venue-list').html(result.venues.map(function (v) {
      return occupancyCardHtml(v, 'col-xl-4');
    }).join(''));

    $('#canteen-list').html(result.canteens.map(function (c) {
      return occupancyCardHtml(c, 'col-xl-4');
    }).join(''));

    var maxUsage = result.rooms.reduce(function (max, r) {
      return Math.max(max, r.usage);
    }, 0);
    $('#room-list').html(result.rooms.map(function (r) {
      return roomCardHtml(r, maxUsage);
    }).join(''));
  });
});
