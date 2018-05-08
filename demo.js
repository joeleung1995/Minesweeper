(function () {
	var mineArr = [],	//用来存放为地雷的dom对象
		pathArr = [],	//用来存放为通道的dom对象
		numArr = [],	//用来存放为数字方块的dom对象
		shadeArr = [],	//存放遮罩层的所有li对象
		allLiArr = [],	//存放底层的所有li对象
		flagArr = [],	//存放所有旗（地雷标识）的位置

		btn = document.getElementsByClassName("btn")[0],			//开始 暂停 重新开始 按钮
		oConfirm = document.getElementsByClassName("confirm")[0],	//失败 胜利 提示框
		oUl = document.getElementsByTagName("ul")[0],				//底层ul对象
		shadeUl = document.getElementsByTagName("ul")[1],			//遮罩层ul对象
		oTime = document.getElementsByTagName("span")[1],			//倒计时的框
		oMine = document.getElementsByTagName("span")[0],			//剩余地雷数的框
		time = 5000,			//剩余时间
		timer;					//倒计时动画的计时器
		lockShift = false;		//锁，由按下和放开左右shift键控制
		mineleft = 99			//剩余的地雷数


	init();


	// 程序初始化
	// ----------------------------------------------------------
	function init () {

		oUl.innerHTML = "";
		shadeUl.innerHTML = "";
		mineArr = [];
		shadeArr = [];
		allLiArr = [];
		flagArr = [];
		pathArr = [];
		numArr = [];

		var oTime = document.getElementsByTagName("span")[1],
			oFrag = document.createDocumentFragment(),
			oFrag2 = document.createDocumentFragment(),
			newLi

		for (let i = 0; i < 480; i++) {
			newLi = document.createElement("li");
			oFrag.appendChild(newLi);
		}

		oUl.appendChild(oFrag);	

		for (let i = 0; i < 480; i++) {
			newLi = document.createElement("li");
			oFrag2.appendChild(newLi);
		}
		shadeUl.appendChild(oFrag2);
		shadeUl.style.opacity = "1";

		shadeArr = Array.prototype.slice.call(shadeUl.children);
		allLiArr = Array.prototype.slice.call(oUl.children);

		oMine.innerText = mineleft;
		oTime.innerText = time;

		createMine();
		numArrPush();



	}

	btn.onclick = function () {
		switch (this.innerText) {
			case "Restart":
				time = 5000;
				timer = setInterval(timeChange, 1000);
				oConfirm.style.display = "none";
				init();
				shadeUl.addEventListener("click", clickBox, false);
				btn.innerHTML = "Pause"
				break;
			case "Start":
				timer = setInterval(timeChange, 1000);
				btn.innerHTML = "Pause"
				shadeUl.addEventListener("click", clickBox, false);
				break;
			case "Pause":
				clearInterval(timer);
				btn.innerHTML = "Continue"
				shadeUl.removeEventListener("click", clickBox, false);
				break;
			case "Continue":
				timer = setInterval(timeChange, 1000);
				btn.innerHTML = "Pause"
				shadeUl.addEventListener("click", clickBox, false);
		}
	}


	// 主要功能
	// -----------------------------------------------------------------

	// 开始暂停
	function pauseTime () {
		if (lockPause) {
			clearInterval(timer);
			btn.innerHTML = "Start"
			lockPause = false;
		} else {
			timer = setInterval(timeChange, 1000);
			btn.innerHTML = "Pause"
			lockPause = true;
		}
	}

	// 时间变化
	function timeChange () {
		time -- ;
		oTime.innerHTML = time;	
		if (time == 0) {
			clearInterval(timer);
			gameOver("Time out");
		}
	}

	// 找地雷
	function clickBox (e) {
		var index = shadeArr.indexOf(e.target);
		if (e.target.style.opacity != "0") {//避免方格点开后，依然可以通过插旗换颜色，这个过程会因为opacity已为0而看不到
			if (!lockShift) {//没按下shift的时候
				if (flagArr.indexOf(index) != -1) {
					flagArr.splice(flagArr.indexOf(index),1);//直接点开插旗的方格，依然可以去除插旗数组的里面该方格的数据
					mineleft ++;
					oMine.innerText = mineleft;
				}
				if (allLiArr[index].className == "mine") {
					gameOver("You lose", index);
				} else if (allLiArr[index].className == "path") {
					crashPath(index)();
				} else if (allLiArr[index].className == "number") {
					allLiArr[index].setAttribute("data", "in");
					shadeArr[index].style.opacity = "0";
					numArr.splice(numArr.indexOf(index), 1);
				}

				if(pathArr.length == 0 && numArr.length == 0) {
					gameOver("You win!");
				}

			} else if (lockShift) {//按下shift的时候
				if (flagArr.indexOf(index) != -1) {//取消这个插旗（标记）
					e.target.style.backgroundColor = "#aaa";
					flagArr.splice(flagArr.indexOf(index),1);
					mineleft ++;
					oMine.innerText = mineleft;
				} else {//插旗（标记）
					e.target.style.backgroundColor = "#A5ECD7";
					flagArr.push(shadeArr.indexOf(e.target));
					mineleft --;
					oMine.innerText = mineleft;
				}
			}
		}

	}

	window.onkeydown = function (e) {
		if (e.code == "ShiftLeft" || e.code == "ShiftRight") {
			lockShift = true;
		}
	}
	window.onkeyup = function (e) {
		if (lockShift) {
			lockShift = false;
		}
	}


	// 遇到地雷，游戏失败
	function gameOver (str, index) {
		clearInterval(timer);
		shadeUl.style.opacity = "0";
		btn.innerHTML = "Restart";
		oConfirm.innerText = str;
		oConfirm.style.display = "block";
		if (index) {	//当有index传进来时，就是踩到地雷，否则就是时间耗尽或者赢了
			allLiArr[index].style.backgroundColor = "#DE3C3C"
		}

		shadeUl.removeEventListener("click", clickBox, false);

	}

	// 遇到通道，点亮通道周围的方格，如果周围的方格中也有通道，就进行连锁反应
	function crashPath (index) {
		return function () {


				var leftArr = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420],
					rightArr = [59, 89, 119, 149, 179, 209, 239, 269, 299, 329, 359, 389, 419, 449];

				var elem = allLiArr[index];
				if (elem.className == "path" && elem.getAttribute("data") == null) {
					shadeArr[index].style.opacity = "0";
					allLiArr[index].setAttribute("data", "in");
					pathArr.splice(pathArr.indexOf(index), 1);
				}


				if (leftArr.indexOf(index) != -1) {//一个比较笨的方法
					breakPath(index - 30)
					breakPath(index - 29)
					breakPath(index + 1)
					breakPath(index + 30)
					breakPath(index + 31)
				} else if (rightArr.indexOf(index) != -1) {
					breakPath(index - 30)
					breakPath(index - 31)
					breakPath(index - 1)
					breakPath(index + 30)
					breakPath(index + 29)
				} else if (index == 0) {
					breakPath(index +1)
					breakPath(index + 30)
					breakPath(index + 31)
				} else if (index == 29) {
					breakPath(index - 1)
					breakPath(index + 30)
					breakPath(index + 29)
				} else if (index == 450) {
					breakPath(index + 1)
					breakPath(index - 30)
					breakPath(index - 29)
				} else if (index == 479) {
					breakPath(index - 1)
					breakPath(index - 30)
					breakPath(index - 31)
				} else if (index >= 1 && index <= 28) {
					breakPath(index - 1)
					breakPath(index + 1)
					breakPath(index + 31)
					breakPath(index + 30)
					breakPath(index + 29)
				} else if (index >= 451 && index <= 478) {
					breakPath(index - 1)
					breakPath(index + 1)
					breakPath(index - 31)
					breakPath(index - 30)
					breakPath(index - 29)
				} else {
					breakPath(index - 30)
					breakPath(index - 29)
					breakPath(index - 31)
					breakPath(index - 1)
					breakPath(index + 1)
					breakPath(index + 31)
					breakPath(index + 29)
					breakPath(index + 30)
				}
		}
	}

	//点亮所点方格周边的方格
	function breakPath (index) {
		var elem = allLiArr[index];
		if (flagArr.indexOf(index) == -1) {
			if (elem.className == "path" && elem.getAttribute("data") == null) {
				shadeArr[index].style.opacity = "0";
				elem.setAttribute("data", "in");
				pathArr.splice(pathArr.indexOf(index), 1);
				crashPath(index)();
			} else if (elem.className == "number" && elem.getAttribute("data") == null) {
				shadeArr[index].style.opacity = "0";
				elem.setAttribute("data", "in");
				numArr.splice(numArr.indexOf(index), 1);
			}
		}
	}

	// 初始化地雷，通道，数字格
	// -----------------------------------------------------------------------
	function createMine () {
		for (let i = 0; i < 99; i++) {
			mineArrPush();
		}

		mineArr.forEach(function (elem, index) {
			allLiArr[elem].className = "mine"
		})	
	}

	function mineArrPush () {
		let index = Math.floor( Math.random() * 480 )
		if ( mineArr.indexOf(index) != -1 ) {
			mineArrPush();
		} else {
			mineArr.push(index);
		}
	}


	function numArrPush () {
		allLiArr.forEach(function (elem, index) {
			if (elem.className == "") {
				var num = count(index);
				if (num == 0) {
					elem.className = "path";
					pathArr.push(index);
				} else {
					elem.innerText = num;
					elem.className = "number";
					numArr.push(index);
				}
			}
		})
	}

	//找目标方块周围的8个方块的情况，一个比较笨的方法
	function count (index) {
		var num = 0,
			leftArr = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420],
			rightArr = [59, 89, 119, 149, 179, 209, 239, 269, 299, 329, 359, 389, 419, 449]

			if (leftArr.indexOf(index) != -1) {
				allLiArr[index - 30].className == "mine" ? num ++ : num;
				allLiArr[index - 29].className == "mine" ? num ++ : num;
				allLiArr[index + 1].className == "mine" ? num ++ : num;
				allLiArr[index + 30].className == "mine" ? num ++ : num;
				allLiArr[index + 31].className == "mine" ? num ++ : num;
			} else if (rightArr.indexOf(index) != -1) {
				allLiArr[index - 30].className == "mine" ? num ++ : num;
				allLiArr[index - 31].className == "mine" ? num ++ : num;
				allLiArr[index - 1].className == "mine" ? num ++ : num;
				allLiArr[index + 30].className == "mine" ? num ++ : num;
				allLiArr[index + 29].className == "mine" ? num ++ : num;
			} else if (index == 0) {
				allLiArr[index + 1].className == "mine" ? num++ : num;
				allLiArr[index + 30].className == "mine" ? num++ : num;
				allLiArr[index + 31].className == "mine" ? num++ : num;
			} else if (index == 29) {
				allLiArr[index - 1].className == "mine" ? num ++ : num;
				allLiArr[index + 30].className == "mine" ? num ++ : num;
				allLiArr[index + 29].className == "mine" ? num ++ : num;
			} else if (index == 450) {
				allLiArr[index + 1].className == "mine" ? num ++ : num;
				allLiArr[index - 30].className == "mine" ? num ++ : num;
				allLiArr[index - 29].className == "mine" ? num ++ : num;
			} else if (index == 479) {
				allLiArr[index - 1].className == "mine" ? num ++ : num;
				allLiArr[index - 30].className == "mine" ? num ++ : num;
				allLiArr[index - 31].className == "mine" ? num ++ : num;
			} else if (index >= 1 && index <= 28) {
				allLiArr[index - 1].className == "mine" ? num ++ : num;
				allLiArr[index + 1].className == "mine" ? num ++ : num;
				allLiArr[index + 31].className == "mine" ? num ++ : num;
				allLiArr[index + 30].className == "mine" ? num ++ : num;
				allLiArr[index + 29].className == "mine" ? num ++ : num;
			} else if (index >= 451 && index <= 478) {
				allLiArr[index - 1].className == "mine" ? num ++ : num;
				allLiArr[index + 1].className == "mine" ? num ++ : num;
				allLiArr[index - 31].className == "mine" ? num ++ : num;
				allLiArr[index - 30].className == "mine" ? num ++ : num;
				allLiArr[index - 29].className == "mine" ? num ++ : num;
			} else {
				allLiArr[index - 30].className == "mine" ? num ++ : num;
				allLiArr[index - 29].className == "mine" ? num ++ : num;
				allLiArr[index - 31].className == "mine" ? num ++ : num;
				allLiArr[index - 1].className == "mine" ? num ++ : num;
				allLiArr[index + 1].className == "mine" ? num ++ : num;
				allLiArr[index + 31].className == "mine" ? num ++ : num;
				allLiArr[index + 29].className == "mine" ? num ++ : num;
				allLiArr[index + 30].className == "mine" ? num ++ : num;
			}

			return num;
	}

})()