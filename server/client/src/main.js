angular.module('quizApp').config(function($stateProvider, $mdThemingProvider, $locationProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise(($injector, $location) => {
		let $state = $injector.get('$state');
		$state.go('admin.dashboard');
	});
	$locationProvider.html5Mode(true);
	$mdThemingProvider.theme('default')
		.primaryPalette('green');

	$stateProvider
		.state('admin', {
			name: 'admin',
			url: '/admin',
			controller: 'admin',
			templateUrl: '/admin.html'
		})
		.state('admin.dashboard', {
			name: 'admin.dashboard',
			url: '/dashboard',
			controller: 'dashboard',
			templateUrl: '/dashboard.html'
		})
		.state('admin.coupons', {
			name: 'admin.coupons',
			url: '/coupons',
			controller: 'coupons',
			templateUrl: '/coupons.html'
		})
		.state('admin.config', {
			name: 'admin.config',
			url: '/config',
			controller: 'config',
			templateUrl: '/config.html'
		})
		.state('admin.questions', {
			name: 'admin.questions',
			url: '/questions',
			controller: 'questions',
			templateUrl: '/questions.html'
		})
		.state('admin.users', {
			name: 'admin.users',
			url: '/users',
			controller: 'users',
			templateUrl: '/users.html'
		})
		.state('admin.couponCodes', {
			name: 'admin.couponCodes',
			url: '/couponCodes',
			controller: 'couponCodes',
			templateUrl: '/couponCodes.html'
		})
		.state('admin.categories', {
			name: 'admin.categories',
			url: '/categories',
			controller: 'categories',
			templateUrl: '/categories.html'
		})
		.state('admin.businesses', {
			name: 'admin.businesses',
			url: '/businesses',
			controller: 'businesses',
			templateUrl: '/businesses.html'
		})
});

angular.module('quizApp').controller('admin', function($scope, $state) { $scope.$state = $state; });
angular.module('quizApp').controller('dashboard', function() {});
angular.module('quizApp').controller('coupons', function() {});
angular.module('quizApp').controller('questions', function() {});
angular.module('quizApp').controller('users', function() {});
angular.module('quizApp').controller('categories', function() {});
angular.module('quizApp').controller('businesses', function() {});
angular.module('quizApp').controller('config', function() {});
angular.module('quizApp').controller('couponCodes', function() {});
angular.module('quizApp').directive('mongoTable', function() {
	return {
		templateUrl: '/mongo-table.html',
		scope: {
			mtDatasource: '@mtDatasource'
		},
		controller: function($scope, $rootScope, $http) {
			$rootScope.limit = $rootScope.limit || 50;
			$scope.data = [];
			$scope.metadata = [];
			$scope.skip = 0;
			$scope.limit = $rootScope.limit;
			var getting = false;

			$scope.get = function(skip, limit, isFirst) {
				if (getting) return;
				getting = true;
				$http({
					method: 'get',
					url: $scope.mtDatasource + '/' + $scope.skip + '/' + $scope.limit
				}).then(function(res) {
					var data = res.data;
					getting = false;
					if (isFirst) {
						$scope.metadata = [].concat(data.meta.fields, [{}]);
						$scope.data = [{}].concat(data.results);
					} else
						$scope.data = $scope.data.concat(res.data.results);
				});
			};

			$scope.patch = function(_id, key, value) {
				$http({
					method: 'patch',
					url: $scope.mtDatasource,
					headers: {
						'Content-Type': 'application/json'
					},
					data: {
						_id: _id,
						key: key,
						value: value
					}
				}).then(function(res) {
					console.log(res);
				});
			}

			$scope.toggleBoolean = function(row, key, $event, isNew) {
				row[key] = $($event.currentTarget).is(':checked');
				!isNew &&
					$scope.patch(row._id, key, row[key]);
			}

			$scope.viewImage = function(url) {
				$('body').append($('<img>').attr({
					src: url
				}).addClass('image-viewer').click(function() {
					this.remove();
				}));
			};

			$scope.getValueFromKeyPath = function(obj, path) {
				return eval('(function(o){ try { return o && o.' + path + ' } catch(err) {} })')(obj);
			}

			$scope.setValueFromKeyPath = function(obj, path, value) {
				return eval('(function(o){ try { o.' + path + ' = ' + JSON.stringify(value) + ' } catch(err) {} })')(obj);
			}

			$scope.insertRow = function(row) {
				$http({
					method: 'put',
					url: $scope.mtDatasource,
					data: row
				}).then(function() {
					$scope.get(0, $scope.limit, true);
				});
			};

			$scope.deleteRow = function(row) {
				confirm('Are you sure you want to delete this row?') &&
					$http({
						method: 'delete',
						url: $scope.mtDatasource + '/' + row._id
					}).then(function() {
						$scope.data.splice($scope.data.indexOf(row), 1);
					});
			};

			$scope.uploadFile = function(inputElement) {
				var fd = new FormData();
				fd.append("file", inputElement.files[0]);
				var xhr = new XMLHttpRequest();
				xhr.addEventListener("load", function(res) {
					var url = 'https://admin.moneyquiz.gr/uploads/' + res.currentTarget.responseText;
					$scope.data.forEach(function(e) {
						e._id == $(inputElement).attr('data-rowid') && (e[$(inputElement).attr('data-fieldkey')] = url);
					});
					$(inputElement).attr('data-isnew') != 'true' &&
						$scope.patch($(inputElement).attr('data-rowid'), $(inputElement).attr('data-fieldkey'), url);
				}, false);
				xhr.open("POST", "/data/file");
				xhr.send(fd);
			};

			$scope.editValue = function(row, key, isNew) {
				var newVal = prompt('Click ok to save new value for key "' + key + '".', row[key]);
				if (newVal != null && newVal != row[key]) {
					$scope.setValueFromKeyPath(row, key, newVal);
					if (!isNew)
						$scope.patch(row._id, key, newVal);
				}
			};

			$scope.callCustomAction = function(actionName, obj) {
				try {
					$scope.customActions[actionName](obj);
				}
				catch(e) {

				}
			}

			$scope.customActions = {
				downloadUsersThatWon: function(obj){
					var win = window.open(`https://admin.moneyquiz.gr/files/won_coupons/${$scope.getValueFromKeyPath(obj, '_id')}`, '_blank');
					if (win) {
						//Browser has allowed it to be opened
						win.focus();
					} else {
						//Browser has blocked it
						alert('Please allow popups for this website');
					}
				},
				openAddCodesToCoupon: function(obj){
					var win = window.open(`https://admin.moneyquiz.gr/coupon/${$scope.getValueFromKeyPath(obj, '_id')}/couponcodes/massive`, '_blank');
					if (win) {
						//Browser has allowed it to be opened
						win.focus();
					} else {
						//Browser has blocked it
						alert('Please allow popups for this website');
					}
				}
			}

			$scope.get($scope.skip, $scope.limit, true);

			$scope.$on('$destroy', function() {
				window.removeEventListener('scroll', scrollHandler);
			});

			window.addEventListener('scroll', scrollHandler);

			function scrollHandler() {
				var scrollTop = $('html').scrollTop() || $('body').scrollTop();
				var scrollHeight = $('html')[0].scrollHeight;
				if (scrollTop > scrollHeight - 2 * innerHeight && !getting) {
					$scope.get($scope.skip += $scope.limit, $scope.limit);
				}
			}
		}
	}
});
