/*! 
 * Created by : Hiếu Lâm (Troy) - Conexus
 * Depends: 
 *	    jquery.ui.widget.js 
 * Version: 1.0.0
 */
 
$(function () {
    $.widget('custom.tabNavigator', {
        // default options
        options: {
            container: $(document),
            ignoreSelector: ':text:focus,:password:focus,textarea:focus,select:focus,button:focus,a:focus',
            clickableSelector: ':text:visible,:password:visible,textarea:visible,select:visible,button:visible:not(.disabled),:button:visible:not(.disabled),a:visible,[onclick],[data-youtube-videoid]:visible,.has-event-handler:visible,.tablesorter-header:not(.tdNosort):visible,.checkbox-custom:visible:not(.disabled),.radio-custom:visible:not(.disabled),.btn-switch:visible:not(.disabled),.radio:not(.hide) > :radio'
        },

        initTabIndex: function ($newContainer) {
            var self = this,
                $currentFocusedHighlightControl = _getFocusedHighlightControl();

            $newContainer.attr('data-tabindex', _getHighestTabIndex() + 1);

            if ($currentFocusedHighlightControl[0]) {
                /* Just focus region when the user is focusing */
                self.focusOnTabRegion($newContainer.data('highlight-sender', $currentFocusedHighlightControl));
            }
        },

        focusOnTabRegion: function ($focusElement) {
            if ($focusElement) {
                var $tabContainer,
                    $document = $(document),
                    i;

                for (i = 0; i < 2; i++) {
                    $document.trigger($.Event('keydown', { keyCode: 27, which: 27 }));
                }

                if ($focusElement.filter('[data-tabindex]')[0]) {
                    $tabContainer = $focusElement.addClass('highlight-block');
                } else {
                    $tabContainer = $focusElement.addClass('highlight-control').parents('[data-tabindex]:first').addClass('highlight-block');
                }

                $.detectElementsHaveEventHandler($tabContainer.add($('div,span,li', $tabContainer)), function ($control) {
                    $control.addClass('has-event-handler');
                });
                $.scrollToElement($tabContainer, -10, true, false);
            }
        },

        // the constructor
        _create: function () {
            var self = this,
                $container = self.element;

            $container.on('keydown.tab-navigator', function (event) {
                var benchmarkName = '[Tab navigator] - Key press';
                $.benchmark(benchmarkName, true);

                event = event || window.event;
                var keyCode = event.keyCode,
                    $focusedHighlightControl,
                    $newFocusedControl;

                if (event.shiftKey) {
                    window.gTabNavigatorShifted = true;
                    switch (keyCode) {
                    case 9: /* TAB */
                        $focusedHighlightControl = _getFocusedHighlightControl();
                        if ($focusedHighlightControl[0]) {
                            $newFocusedControl = self._gotoControlByArrows();
                            if ($newFocusedControl.is(':text,:password,textarea')) {
                                if ($newFocusedControl.hasClass('hasDatepicker')) {
                                    $newFocusedControl.datepicker('show');
                                }
                                $.focusOnControl($newFocusedControl);
                            } else {
                                $focusedHighlightControl.trigger('blur');
                            }

                            return false;
                        } else {
                            if (!self._focusOnInputControl() && self._gotoPreviousRegionByTab()) {
                                return false;
                            }
                        }
                        return true;
                    }
                }

                switch (keyCode) {
                case 9: /* TAB */
                    $focusedHighlightControl = _getFocusedHighlightControl();
                    if ($focusedHighlightControl[0]) {
                        $newFocusedControl = self._gotoControlByArrows(true);
                        if ($newFocusedControl.is(':text,:password,textarea')) {
                            if ($newFocusedControl.hasClass('hasDatepicker')) {
                                $newFocusedControl.datepicker('show');
                            }
                            $.focusOnControl($newFocusedControl);
                        } else {
                            $focusedHighlightControl.trigger('blur');
                        }
                        $.benchmark(benchmarkName);
                        return false;
                    } else {
                        if (!self._focusOnInputControl() && self._gotoNextRegionByTab()) {
                            $.benchmark(benchmarkName);
                            return false;
                        }
                    }

                    break;
                case 38:
                    $focusedHighlightControl = _getFocusedHighlightControl();

                    if ($focusedHighlightControl.is('select')) {
                        /* Move to previous option */
                        var currentSelectedIndex = $('option:selected', $focusedHighlightControl).index();
                        if (currentSelectedIndex > 0) {
                            $focusedHighlightControl[0].selectedIndex = currentSelectedIndex - 1;
                        }
                        return false;
                    } else {
                        if (self._focusOnInputControl()) {
                            return true;
                        }
                        return self._gotoControlByArrows().size() === 0;
                    }
                case 37: /* LEFT ARROW */
                    if (self._focusOnInputControl()) {
                        return true;
                    }
                    return self._gotoControlByArrows().size() === 0;
                case 39: /* RIGHT ARROW */
                    if (self._focusOnInputControl()) {
                        return true;
                    }
                    return self._gotoControlByArrows(true).size() === 0;
                case 40:
                    $focusedHighlightControl = _getFocusedHighlightControl();

                    if ($focusedHighlightControl.is('select')) {
                        /* Move to next option */
                        var selectedIndex = $('option:selected', $focusedHighlightControl).index();
                        if (selectedIndex < $('option', $focusedHighlightControl).size() - 1) {
                            $focusedHighlightControl[0].selectedIndex = selectedIndex + 1;
                        }
                        return false;
                    } else {
                        if (self._focusOnInputControl()) {
                            return true;
                        }
                        return self._gotoControlByArrows(true).size() === 0;
                    }
                case 13: /* ENTER */
                case 32: /* SPACE BAR */
                    return !self._executeFocusedControl(keyCode);
                case 27: /* ESC */
                    var $focusedInput = $(self.options.ignoreSelector);

                    if ($focusedInput[0]) {
                        $focusedInput.trigger('blur');
                        return false;
                    } else {
                        return !self._blurHighlightElement();
                    }
                }

                return true;
            }).on('keyup.tab-navigator', function (event) {
                event = event || window.event;

                if (event.shiftKey) {
                    delete window.gTabNavigatorShifted;
                }
            });
        },

        _blurHighlightElement: function () {
            var result = false,
                $highlightControl = $('.highlight-control'),
                $highlightBlock,
                $lastModal = $('.modal.in.esc:last');

            if ($lastModal[0]) {
                /* Close modal popup */
                $('[data-dismiss=modal]:first', $lastModal).trigger('click');
            } else {
                /* Executing when no visible popup on page */
                if ($highlightControl[0]) {
                    $highlightControl.removeClass('highlight-control');
                    result = true;
                } else {
                    $highlightBlock = $('.highlight-block');
                    if ($highlightBlock[0]) {
                        $highlightBlock.removeClass('highlight-block');
                        result = true;
                    }
                }
            }

            return result;
        },

        _executeFocusedControl: function (keyCode) {
            var $currentFocusedTabRegion = $('[data-tabindex].highlight-block:first'),
                $focusedControl,
                $clickableControls,
                result = false;

            if ($currentFocusedTabRegion[0]) {
                $clickableControls = $(this.options.clickableSelector, $currentFocusedTabRegion);
                $focusedControl = $clickableControls.filter('.highlight-control');

                if ($focusedControl[0]) {
                    if ($focusedControl.is('a')) {
                        $.triggerClickOnLink($focusedControl);
                    } else {
                        if ($focusedControl.data('youtube-videoid')) {
                            var playState = $focusedControl.attr('data-state');

                            if (playState === '1') {
                                window['g' + $focusedControl.attr('id') + 'Player'].pauseVideo();
                            } else {
                                window['g' + $focusedControl.attr('id') + 'Player'].playVideo();
                            }
                        } else {
                            if ($focusedControl.hasClass('tablesorter-header')) {
                                /* Sorting table */
                                var $sortTable = $focusedControl.parents('table:first');

                                $sortTable.trigger('sorton', [_getSortConfig($sortTable[0].config.sortList, $focusedControl.index(), $focusedControl.hasClass('tablesorter-headerAsc') ? 1 : 0)]);
                            } else {
                                if ((keyCode === 13 || keyCode === 32) && $focusedControl.is(':text,:password,textarea')) {
                                    if ($focusedControl.is(':focus')) {
                                        return false;
                                    } else {
                                        $.focusOnControl($focusedControl);
                                        return true;
                                    }
                                }
                                $focusedControl.trigger('click');
                            }
                        }
                    }

                    result = true;
                } else {
                    if ($currentFocusedTabRegion.hasClass('has-event-handler')) {
                        $currentFocusedTabRegion.trigger('click');
                        result = true;
                    } else {
                        if ($clickableControls[0]) {
                            $clickableControls.first().addClass('highlight-control');

                            if ($clickableControls.size() === 1) {
                                /* Click on first clickable control */
                                result = this._executeFocusedControl(keyCode);
                            } else {
                                result = true;
                            }
                        } else {
                            result = true;
                        }
                    }
                }
            }

            return result;
        },

        _focusOnInputControl: function () {
            return $(this.options.ignoreSelector).size() > 0;
        },

        _gotoNextRegionByTab: function () {
            var $tabRegions = $('[data-tabindex]:visible'),
                $currentFocusedTabRegion,
                currentTabIndex,
                tabIndexList = [],
                tabIndexListLength,
                nextTabIndex,
                $nextTabRegion;

            if ($tabRegions[0]) {
                $currentFocusedTabRegion = $tabRegions.filter('.highlight-block:first');
                if ($currentFocusedTabRegion[0]) {
                    currentTabIndex = parseInt($currentFocusedTabRegion.data('tabindex'));
                    tabIndexList.push(currentTabIndex);

                    /* Get list of tab index */
                    $('[data-tabindex]:visible:not(.highlight-block)').each(function () {
                        tabIndexList.push(parseInt($(this).data('tabindex')));
                    });

                    tabIndexListLength = tabIndexList.length;
                    if (tabIndexListLength > 0) {
                        /* Sort numbers in an array in ascending order */
                        tabIndexList.sort(function (a, b) { return a - b; });
                    }

                    nextTabIndex = tabIndexList[($.inArray(currentTabIndex, tabIndexList) + 1) % tabIndexListLength];

                    $('.highlight-control', $currentFocusedTabRegion.removeClass('highlight-block')).removeClass('highlight-control');

                    $nextTabRegion = $('[data-tabindex="' + nextTabIndex + '"]:first').addClass('highlight-block');
                } else {
                    $nextTabRegion = $('[data-tabindex]:visible:first').addClass('highlight-block');
                }

                $.detectElementsHaveEventHandler($nextTabRegion.add($('div,span,li', $nextTabRegion)), function ($control) {
                    $control.addClass('has-event-handler');
                });
                $.scrollToElement($nextTabRegion, -10, true, false);

                return true;
            } else {
                return false;
            }
        },

        _gotoPreviousRegionByTab: function () {
            var $tabRegions = $('[data-tabindex]:visible'),
                $currentFocusedTabRegion,
                currentTabIndex,
                tabIndexList = [],
                tabIndexListLength,
                previousTabIndex,
                $previousTabRegion;

            if ($tabRegions[0]) {
                $currentFocusedTabRegion = $tabRegions.filter('.highlight-block:last');

                if ($currentFocusedTabRegion[0]) {
                    currentTabIndex = parseInt($currentFocusedTabRegion.data('tabindex'));
                    tabIndexList.push(currentTabIndex);

                    /* Get list of tab index */
                    $('[data-tabindex]:visible:not(.highlight-block)').each(function () {
                        tabIndexList.push(parseInt($(this).data('tabindex')));
                    });

                    tabIndexListLength = tabIndexList.length;
                    if (tabIndexListLength > 0) {
                        /* Sort numbers in an array in ascending order */
                        tabIndexList.sort(function (a, b) { return a - b; });
                    }

                    previousTabIndex = tabIndexList[($.inArray(currentTabIndex, tabIndexList) - 1 + tabIndexListLength) % tabIndexListLength];

                    $('.highlight-control', $currentFocusedTabRegion.removeClass('highlight-block')).removeClass('highlight-control');

                    $previousTabRegion = $('[data-tabindex="' + previousTabIndex + '"]:first').addClass('highlight-block');
                } else {
                    $previousTabRegion = $('[data-tabindex]:last').addClass('highlight-block');
                }

                $.detectElementsHaveEventHandler($previousTabRegion.add($('div,span,li', $previousTabRegion)), function ($control) {
                    $control.addClass('has-event-handler');
                });
                $.scrollToElement($previousTabRegion, 0, true, false);

                return true;
            } else {
                return false;
            }
        },

        _gotoControlByArrows: function (isGotoNextControl) {
            var $currentFocusedTabRegion = $('[data-tabindex].highlight-block:first'),
                $controls,
                $focusedControl = $(),
                $nextControl, $previousControl;

            if ($currentFocusedTabRegion[0]) {
                $controls = $(this.options.clickableSelector, $currentFocusedTabRegion);

                if ($controls[0]) {
                    $focusedControl = $controls.filter('.highlight-control');

                    if ($focusedControl[0]) {
                        $focusedControl.removeClass('highlight-control');
                        if (isGotoNextControl) {
                            $nextControl = $controls.eq($controls.index($focusedControl[0]) + 1);
                            $focusedControl = ($nextControl[0] ? $nextControl : $controls.first()).addClass('highlight-control');
                        } else {
                            $previousControl = $controls.eq($controls.index($focusedControl[0]) - 1);
                            $focusedControl = ($previousControl[0] ? $previousControl : $controls.last()).addClass('highlight-control');
                        }
                    } else {
                        $focusedControl = $controls.first().addClass('highlight-control');
                    }

                    if ($focusedControl.is(':visible')) {
                        $.scrollToElement($focusedControl, -10, true, false);
                    }

                }
            }

            return $focusedControl;
        },

        _detectElementsHaveEventHandler: function ($controls) {
            $controls.each(function () {
                var $control = $(this),
                    events = $._data($control[0], 'events');

                if (events && events['click']) {
                    $control.addClass('has-event-handler');
                }
            });
        },

        // events bound via _on are removed automatically
        // revert other modifications here
        _destroy: function () {
            var self = this,
                $container = self.element;

            $container.off('keydown.tab-navigator keyup.tab-navigator');
        }
    });
});

function _getHighestTabIndex() {
    var maxTabIndex = 0,
        $tabRegions = $('[data-tabindex]');

    $tabRegions.each(function () {
        var tabIndex = parseInt($(this).data('tabindex'));

        if (maxTabIndex < tabIndex) {
            maxTabIndex = tabIndex;
        }
    });

    return maxTabIndex;
}

function _getSortConfig(tableSortList, columnIndex, sortDirection) {
    if (window.gTabNavigatorShifted) {
        var configIndex = _checkSortConfigItemIndex(tableSortList, columnIndex);

        if (configIndex === -1) {
            tableSortList.push([columnIndex, sortDirection]);
        } else {
            tableSortList[configIndex] = [columnIndex, sortDirection];
        }
    } else {
        tableSortList = [[columnIndex, sortDirection]];
    }

    return tableSortList;
}

function _checkSortConfigItemIndex(tableSortList, columnIndex) {
    var configIndex = -1;

    $.each(tableSortList, function (index) {
        if (this[0] === columnIndex) {
            configIndex = index;
            return false;
        }
        return true;
    });

    return configIndex;
}

function _getFocusedHighlightControl() {
    return $('[data-tabindex].highlight-block:first .highlight-control:first');
}