$(() => {
	$(document).ajaxSuccess(function (event, xhr, settings, data) {
		Notice.success(data.msg);
	}).ajaxError(function (event, xhr, settings, error) {
		if (xhr.status === 401) {
			Notice.error("Authentication required.");
			Login.show();
		} else {
			if (xhr.responseJSON && xhr.responseJSON.msg) {
				Notice.error(xhr.responseJSON.msg);
			} else {
				Notice.error("Unexpected error occurred.");
			}
		}
	});

	$("[href='#!']").click(event => event.preventDefault());
});

class Notice {
	static info(content) {
		this.show(content, "blue");
	}

	static warn(content) {
		this.show(content, "yellow");
	}

	static error(content) {
		this.show(content, "red");
	}

	static success(content) {
		this.show(content, "green");
	}

	static show(content, color) {
		new jBox("Notice", {
			animation: {
				open: "slide",
				close: "flip"
			},
			color: color,
			content: content,
			delayOnHover: true,
			showCountdown: true,
			offset: {
				y: 100,
			},
		});
	}
}

class Ajax {
	static get(url, data, callback, dataType) {
		return this.send("GET", url, data, callback, dataType);
	}

	static post(url, data, callback, dataType) {
		return this.send("POST", url, data, callback, dataType);
	}

	static put(url, data, callback, dataType) {
		return this.send("PUT", url, data, callback, dataType);
	}

	static delete(url, data, callback, dataType) {
		return this.send("DELETE", url, data, callback, dataType);
	}

	static send(method, url, data, callback, dataType) {
		if ($.isFunction(data)) {
			dataType = dataType || callback;
			callback = data;
			data = undefined;
		}
		return $.ajax({
			method: method,
			url: url,
			data: data,
			success: callback,
			dataType: dataType || "json",
			dataFilter: function (data, type) {
				return data || "{}"
			}
		});
	}
}

class Login {
	static url;
	static callback;
	static visible;

	static init(url, callback) {
		this.url = url;
		this.callback = callback;
	}

	static show(modal) {
		if (this.visible) {
			return;
		}
		this.visible = true;
		new jBox("Modal", {
			content: `<form class="noselect">
						<h2 class="ac mt0 bb">Log In</h2>
						<p><input class="w100" id="username" type="text" name="username" placeholder="Username" required/></p>
						<p><input class="w100" type="password" name="password" placeholder="Password" required/></p>
						<p>
							<input type="checkbox" id="remember" name="remember" value="true"/>
							<label for="remember">Remember me</label>
						</p>
						<p class="mb1"><button class="primary ripple w100">Log In</button></p>
					</form>`,
			closeOnEsc: !modal,
			closeOnClick: modal ? false : "overlay",
			closeButton: modal ? false : "overlay",
			onCreated() {
				let form = $(`#${this.id} form`);
				form.submit(event => {
					let btn = form.find("button");
					btn.prop("disabled", true);
					Ajax.post(this.url || "/login", form.serialize())
						.done(data => {
							if (this.callback) {
								this.callback.apply(data);
							} else {
								let url = new URL(window.location.href).searchParams.get("url");
								if (modal && url === null) {
									url = "/";
								}
								if (url !== null) {
									window.location.href = url;
								}
							}
							this.close();
						}).always(() => btn.prop("disabled", false));
					event.preventDefault();
				});
			},
			onCloseComplete() {
				Login.visible = false;
				this.destroy();
			}
		}).open();
		$("#username").focus();
	}
}

class Header {
	static handlers = {}; // a.id -> click handler

	static init(handlers) {
		this.handlers["btn-nav"] = _ => Navbar.toggle();
		this.handlers["btn-search"] = _ => Searchbar.show();
		$.extend(this.handlers, handlers);
		$("#header").on("click", "a", function (event) {
			let callback = Header.handlers[$(this).attr("id")];
			if (callback) {
				callback.apply(event);
			}
		});
		new jBox("Tooltip", {
			attach: "#actions > a",
			theme: "TooltipDark",
			animation: "zoomOut"
		});
	}
}

class Searchbar {
	static form;
	static input;
	static button;

	static init(submitCallback) {
		this.form = $("#form-search");
		this.input = $("#keyword");
		this.button = $("#btn-close");
		this.form.submit((event) => {
			if (submitCallback) {
				submitCallback.apply(event);
			}
			event.preventDefault();
		});
		this.button.click(event => {
			this.hide()
			event.preventDefault();
		});
		$(document).keyup(event => {
			if (event.keyCode === 27) { // esc
				this.hide()
			}
		});
	}

	static show() {
		this.form.addClass("show");
		this.input.focus();
	}

	static hide() {
		this.form.removeClass("show");
	}

	static submit() {
		this.form.submit();
	}
}

class Navbar {
	static handlers = {}; // li.id -> click handler

	static init(handlers) {
		$.extend(this.handlers, handlers);
		new PerfectScrollbar("#nav");
		$("#nav").on("click", "a", function (event) {
			let parent = this.parentNode;
			$(".has-sub").not(parent).removeClass("expanded");
			$(parent).toggleClass("expanded");
			let id = $(this).attr("id");
			Navbar.select(id);
			let callback = Navbar.handlers[id];
			if (callback) {
				callback.apply(event);
			}
		});
	}

	static toggle() {
		$(document.body).toggleClass("nav-expanded");
	}

	static select(navId) {
		let node = $("#" + navId);
		if (node[0] && node[0].hasAttribute("noselect")) {
			return;
		}
		$("#nav li").removeClass("active");
		node.parent("li").addClass("active").parents("li").addClass("active expanded");
	}

	static append(navId, navMdiIcon, navName, navHandler, noselect, parentNavId) {
		this.handlers[navId] = navHandler;
		let html = this.render(navId, navMdiIcon, navName, noselect);
		if (parentNavId) {
			let node = $("#" + parentNavId).parent("li");
			if (node.hasClass("has-sub")) {
				node.find("ul").append(html);
			} else {
				node.addClass("has-sub").append(`<ul>${html}</ul>`);
			}
		} else {
			$("#nav > ul").append(html);
		}
	}

	static remove(navId) {
		let node = $("#" + navId).parent("li");
		let parents = node.parents("li");
		node.remove();
		let subs = parents.find("li");
		if (parents.length > 0 && subs.length === 0) {
			parents.removeClass("has-sub").find("ul").remove();
		}
	}

	static clear(navId) {
		$("#" + navId).parent("li").removeClass("has-sub expanded").find("ul").remove();
	}

	static render(navId, navMdiIcon, navName, noselect) {
		let attr = noselect ? " noselect" : "";
		return `<li><a id="${navId}"><span class="iconify-inline" data-icon="mdi:${navMdiIcon}"${attr}></span><span>${navName}</span></a></li>`;
	}
}