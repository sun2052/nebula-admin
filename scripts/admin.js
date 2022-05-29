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
				y: 50,
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

function showLogin(modal) {
	new jBox("Modal", {
		content: `<form>
					<p><input class="w100" id="username" type="text" name="username" placeholder="Username" required/></p>
					<p><input class="w100" type="password" name="password" placeholder="Password" required/></p>
					<p>
						<input type="checkbox" id="remember" name="remember" value="true"/>
						<label for="remember">Remember me</label>
					</p>
					<p><button class="primary ripple w100">Log In</button></p>
				</form>`,
		closeOnEsc: !modal,
		closeOnClick: modal ? false : "overlay",
		closeButton: modal ? false : "overlay",
		onCreated() {
			let form = $(`#${this.id} form`);
			form.submit(event => {
				let btn = form.find("button");
				btn.prop("disabled", true);
				Ajax.post("login", form.serialize())
				.done(_ => {
						let url = new URL(window.location.href).searchParams.get("url");
						if (modal && url === null) {
							url = "/";
						}
						if (url !== null) {
							window.location.href = url;
						}
						this.close();
					}).always(() => btn.prop("disabled", false));
				event.preventDefault();
			});
		},
		onCloseComplete() {
			this.destroy();
		}
	}).open();
	$("#username").focus();
}

$(() => {
	$(document).ajaxSuccess(function (event, xhr, settings, data) {
		Notice.success(data.msg);
	}).ajaxError(function (event, xhr, settings, error) {
		if (xhr.status === 401) {
			Notice.error("Authentication required.");
			showLogin();
		} else {
			if (xhr.responseJSON && xhr.responseJSON.msg) {
				Notice.error(xhr.responseJSON.msg);
			} else {
				Notice.error("Unexpected error occurred.");
			}
		}
	});

	$("[href='#!']").click(event => event.preventDefault());

	new PerfectScrollbar("#nav");

	new jBox("Tooltip", {
		attach: "#actions > a",
		theme: "TooltipDark",
		animation: "zoomOut"
	});

	$("#nav-toggle").click(_ => $(document.body).toggleClass("nav-expanded"));

	$("#search-toggle").click(event => {
		$("#form-search").addClass("show");
		$("#keyword").focus();
		event.preventDefault();
	});

	$("#search-close").click(event => {
		$("#form-search").removeClass("show");
		event.preventDefault();
	});

	$(document).keyup(event => {
		if (event.keyCode === 27) {
			$("#search-close").trigger("click");
		}
	});

	$("#form-search").submit(event => {
		
		event.preventDefault();
	});

	$(".has-sub").click(function (event) {
		$(".has-sub").not(this).removeClass("expanded");
		$(this).toggleClass("expanded");
		event.preventDefault();
	});
});
