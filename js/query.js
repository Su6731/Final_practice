/* ==========================================================================
   综合查询页：三业态选项卡 + 名称搜索 + 各业态条件即时筛选（jQuery）
   ========================================================================== */
$(function () {
  'use strict';

  var state = {
    category: 'sports',
    venues: [],
    canteens: [],
    rooms: [],
    maxUsage: 0
  };

  var UNIT_TEXT = { sports: '个场馆', canteen: '座食堂', rooms: '间自习室' };

  // 占用率卡片（场馆 / 食堂通用）
  function occupancyCardHtml(item) {
    var level = CampusData.levelOf(item);
    var rate = Math.round(level.rate * 100);

    return [
      '<div class="col-md-6 col-xl-4">',
      '  <div class="card service-card rate-' + level.key + '">',
      '    <div class="card-body">',
      '      <div class="service-head">',
      '        <h5 class="service-name"><span class="service-icon"><i class="bi ' + item.icon + '"></i></span>', item.name, '</h5>',
      '        <span class="badge level-badge ' + level.badge + '">', level.text, '</span>',
      '      </div>',
      '      <div class="service-count">', item.current, ' <small>/ ', item.capacity, ' 人</small></div>',
      '      <div class="progress mt-2" role="progressbar" aria-valuenow="', rate,
      '" aria-valuemin="0" aria-valuemax="100">',
      '        <div class="progress-bar" style="width:', rate, '%"></div>',
      '      </div>',
      '      <p class="service-meta mb-0">',
      '        <i class="bi bi-clock"></i>', item.openHours || item.hours,
      item.type ? '<span class="ms-3"><i class="bi bi-geo-alt"></i>' + item.type + '</span>' : '',
      '        <span class="ms-3">占用率 ', rate, '%</span></p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  // 自习室卡片
  function roomCardHtml(room) {
    var isOpen = room.status === 'open';
    var percent = state.maxUsage ? Math.round((room.usage / state.maxUsage) * 100) : 0;
    var badge = isOpen
      ? '<span class="badge level-badge text-bg-success">开放中</span>'
      : '<span class="badge level-badge text-bg-secondary">已关闭</span>';

    return [
      '<div class="col-md-6 col-xl-4">',
      '  <div class="card service-card' + (isOpen ? '' : ' is-closed') + '">',
      '    <div class="card-body">',
      '      <div class="service-head">',
      '        <h5 class="service-name"><span class="service-icon"><i class="bi ' + room.icon + '"></i></span>', room.name, '</h5>',
      badge,
      '      </div>',
      '      <div class="service-count">', room.seats, ' <small>个座位</small></div>',
      '      <div class="progress mt-2" role="progressbar" aria-valuenow="', percent,
      '" aria-valuemin="0" aria-valuemax="100">',
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

  function keywordMatch(name) {
    var kw = $.trim($('#q-name').val()).toLowerCase();
    return !kw || name.toLowerCase().indexOf(kw) !== -1;
  }

  function pickSports() {
    var type = $('#q-type').val();
    var level = $('#q-level').val();
    return state.venues.filter(function (v) {
      return keywordMatch(v.name)
        && (type === 'all' || v.type === type)
        && (level === 'all' || CampusData.levelOf(v).key === level);
    });
  }

  function pickCanteens() {
    var level = $('#q-clevel').val();
    return state.canteens.filter(function (c) {
      return keywordMatch(c.name)
        && (level === 'all' || CampusData.levelOf(c).key === level);
    });
  }

  function pickRooms() {
    var floor = $('#q-floor').val();
    var status = $('#q-status').val();
    return state.rooms.filter(function (r) {
      return keywordMatch(r.name)
        && (floor === 'all' || String(r.floor) === floor)
        && (status === 'all' || r.status === status);
    });
  }

  function applyFilters() {
    var matched;
    if (state.category === 'sports') {
      matched = pickSports();
      $('#result-list').html(matched.map(occupancyCardHtml).join(''));
    } else if (state.category === 'canteen') {
      matched = pickCanteens();
      $('#result-list').html(matched.map(occupancyCardHtml).join(''));
    } else {
      matched = pickRooms();
      $('#result-list').html(matched.map(roomCardHtml).join(''));
    }

    $('#result-count').text('共 ' + matched.length + ' ' + UNIT_TEXT[state.category]);
    $('#result-empty').toggleClass('d-none', matched.length !== 0);
  }

  // 切换业态：选项卡高亮 + 对应筛选组显示
  function switchCategory(cat) {
    state.category = cat;
    $('#catTab .nav-link').removeClass('active').attr('aria-selected', 'false');
    $('#catTab .nav-link[data-cat="' + cat + '"]').addClass('active').attr('aria-selected', 'true');
    $('.filter-group').removeClass('active');
    $('.filter-group[data-group="' + cat + '"]').addClass('active');
    applyFilters();
  }

  CampusData.load('data/data.json').then(function (result) {
    state.venues = result.venues;
    state.canteens = result.canteens;
    state.rooms = result.rooms;
    state.maxUsage = result.rooms.reduce(function (max, r) {
      return Math.max(max, r.usage);
    }, 0);

    // 楼层下拉项根据数据动态生成
    var floors = result.rooms.map(function (r) { return r.floor; })
      .filter(function (f, i, arr) { return arr.indexOf(f) === i; })
      .sort(function (a, b) { return a - b; });
    floors.forEach(function (f) {
      $('#q-floor').append('<option value="' + f + '">' + f + ' 层</option>');
    });

    applyFilters();
  });

  // 输入与下拉变化即时生效（input 兼顾粘贴与清除按钮）
  $('#q-name').on('input', applyFilters);
  $('#q-type, #q-level, #q-clevel, #q-floor, #q-status').on('change', applyFilters);

  $('#catTab .nav-link').on('click', function () {
    switchCategory($(this).attr('data-cat'));
  });

  // 重置：清空关键词与当前业态的全部筛选
  $('#q-reset').on('click', function () {
    $('#q-name').val('');
    if (state.category === 'sports') {
      $('#q-type, #q-level').val('all');
    } else if (state.category === 'canteen') {
      $('#q-clevel').val('all');
    } else {
      $('#q-floor, #q-status').val('all');
    }
    applyFilters();
  });
});
