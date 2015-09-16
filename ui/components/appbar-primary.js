/* eslint-env browser */
/* global $ */

"use strict";

const showMenu = require("../utils/show-menu.js"),
	  userUtils = require("../../lib/user-utils.js"),
	  getAvatar = require("../../lib/get-avatar.js"),
	  buildTitle = require("../../lib/build-title.js"),
	  url = require("../../lib/url.js");

module.exports = function(core, config, store) {
	const React = require("react"),
		  Badge = require("./badge.js")(core, config, store),
		  NotificationCenter = require("../../notification/notification-center.js")(core, config, store),
		  FollowButton = require("./follow-button.js")(core, config, store);

	class AppbarPrimary extends React.Component {
		constructor(props, context) {
			super(props, context);
			this.badgeFilter = this.badgeFilter.bind(this);
			this.fullScreen = this.fullScreen.bind(this);
			this.goBack = this.goBack.bind(this);
			this.onJoin = this.onJoin.bind(this);
			this.onStateChange = this.onStateChange.bind(this);
			this.showNotifications = this.showNotifications.bind(this);
			this.showUserMenu = this.showUserMenu.bind(this);
			this.toggleMinimize = this.toggleMinimize.bind(this);
			this.toggleSidebarRight = this.toggleSidebarRight.bind(this);

			this.state = {
				title: "",
				username: "",
				picture: "",
				following: false
			};
		}

		toggleSidebarRight() {
			core.emit("setstate", { nav: { view: "sidebar-right" }});
		}

		showJoinStatus() {
			let popover = document.createElement("div"),
				message = document.createElement("div"),
				content = document.createElement("div"),
				action = document.createElement("a"),
				$popover = $(popover);

			message.textContent = "A request has been sent to follow the room.";

			content.classList.add("popover-content");
			content.appendChild(message);

			action.classList.add("popover-action");
			action.textContent = "Cancel request";

			action.addEventListener("click", () => {
				core.emit("part-up",  { to: store.get("nav", "room") });

				$popover.popover("dismiss");
			}, false);

			popover.appendChild(content);
			popover.appendChild(action);

			$popover.popover({ origin: React.findDOMNode(this.refs.followButton) });
		}

		toggleMinimize(e) {
			if (e.target.tagName === "A" || e.target.parentNode.tagName === "A" ||
				(e.target.className && e.target.className.indexOf && e.target.className.indexOf("user-area") > -1)) {
				return;
			}

			if (store.get("context", "env") === "embed" && store.get("context", "embed", "form") === "toast") {
				core.emit("setstate", {
					context: {
						embed: { minimize: !store.get("context", "embed", "minimize") }
					}
				});
			}
		}

		fullScreen() {
			window.open(url.build({ nav: store.get("nav") }), "_blank");
		}

		badgeFilter(note) {
			return note.score >= 30;
		}

		showNotifications(event) {
			let center = document.createElement("div");

			center.className = "menu menu-notifications";

			React.render(<NotificationCenter />, center);

			$(center).popover({
				arrow: false,
				origin: event.currentTarget
			});
		}

		showUserMenu(e) {
			core.emit("user-menu", {
				origin: e.currentTarget,
				buttons: {},
				items: {}
			}, (err, menu) => {
				if (err) {
					return;
				}

				showMenu("user-menu", menu);
			});
		}

		goBack() {
			var mode = store.get("nav", "mode");

			if (mode === "chat") {
				core.emit("setstate", {
					nav: { mode: "room" }
				});
			} else if (mode === "room") {
				core.emit("setstate", {
					nav: { mode: "home" }
				});
			}
		}

		render() {
			return (
				<div key="appbar-primary" className="appbar appbar-primary custom-titlebar-bg custom-titlebar-fg" onClick={this.toggleMinimize}>
					<a data-mode="room chat" className="appbar-icon appbar-icon-back appbar-icon-left" onClick={this.goBack}></a>
					<span data-mode="home" className="appbar-logotype appbar-title-logotype" />
					<div data-mode="room chat" className="appbar-title-container">
						<span className="appbar-logotype appbar-logotype-primary" />
						<h1 className="appbar-title appbar-title-primary">{this.state.title}</h1>
					</div>
					<div className="user-area" onClick={this.showUserMenu}>
						<img className="user-area-avatar" alt={this.state.username} src={this.state.picture} />
						<div className="user-area-nick">{this.state.username}</div>
					</div>
					<a className="appbar-bell appbar-icon appbar-icon-alert" onClick={this.showNotifications}>
						<Badge className="appbar-bell-badge" filter={this.badgeFilter} groupCount />
					</a>
					<a data-embed="toast canvas" className="appbar-icon appbar-icon-maximize" onClick={this.fullScreen}></a>
					<a data-mode="room chat" className="appbar-icon appbar-icon-people" onClick={this.toggleSidebarRight}></a>

					<FollowButton data-embed="none" data-role="guest registered follower" data-mode="room chat" data-state="online"
						ref="followButton" className="appbar-icon appbar-icon-follow" />
				</div>
			);
		}

		onStateChange(changes) {
			var user = store.get("user"),
				userObj;

			if ((changes.nav && changes.nav.mode) || changes.user ||
				(changes.entities && changes.entities[user])) {

				userObj = store.getUser();

				this.setState({
					title: buildTitle(store.get(), true),
					username: userUtils.getNick(user),
					picture: userObj ? getAvatar(userObj.picture, 48) : ""
				});
			}
		}

		onJoin(action) {
			if (/^(room|chat)$/.test(store.get("nav", "mode")) && store.get("nav", "room") === action.to &&
				action.transitionType === "request" && action.transitionRole === "follower" && action.user && action.user.id === store.get("user")) {
				this.showJoinStatus();
			}
		}

		componentDidMount() {
			core.on("statechange", this.onStateChange, 500);
			core.on("join-dn", this.onJoin, 100);
		}

		componentWillUnmount() {
			core.off("statechange", this.onStateChange);
			core.off("join-dn", this.onJoin);
		}
	}

	return AppbarPrimary;
};
