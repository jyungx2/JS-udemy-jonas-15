'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  // global scope에 정의내린 변수들을 App class안으로 가져와 최대한 연결되도록..(수업 때 언급됐던 결합도 높인다는 개념?)
  // 3️⃣ global EC에 선언한 mapEvent, map을 모두 App class로 만든 객체 안에 프라이빗하게 넣어 외부에서 맘대로 조작할 수 없도록 하자 => private field로 만들자.
  // ⛳️ loadMap메서드 안에서 map(Event) -> this.#map으로 바꿔주자. (더 이상 글로벌 스콥에 있지 않고, 객체 안에 생성되는 것이므로 this keyword 적어줘야함!)
  #map;
  #mapEvent;

  constructor() {
    // 2️⃣ global EC에 쓰지 말고, constructor안에 넣자!💫
    //  이 contstructor 메서드는 새로운 객체가 만들어질 때 즉시 호출된다. 즉 페이지가 로드되자마자 객체가 만들어지기 때문에 함께 실행되는 이 constructor 메서드도 페이지가 로드되자마자 호출된다.
    // Load page -> constructor() -> _getPosition() ... trigger되는 순서
    this._getPosition(); // ✨

    // 📌 236. Rendering workout inform form
    // form.addEventListener + inputType.addEventListener => 이 둘은 모두 객체 안에서 유저가 해당 이벤트 발생시에 실행되야 하는 코드가 담겨 있음 ->  객체 안에 존재해야 하는 이벤트 리스너 함수..
    // 5️⃣ _newWorkout() 메서드에 기존 함수 넣기
    // 스크립트가 로드되자마자 만들어져야 코드 -> 유저가 다음과 같은 이벤트를 발생시킬 때마다 실행되어야 하는 코드이기 때문에,  constructor 메서드 안에..
    form.addEventListener('submit', this._newWorkout.bind(this));
    // 🌟 폼을 제출한다는 것은 새로운 운동기록을 만든다는 뜻이니까, 콜백함수 부분을 _newWorkout 메서드에 넣고 여기선 그냥 불러오기만... (this._newWorkout)

    // 💥2️⃣ eventlistener상에서 this = form 을 가리키므로, bind(this)로 this keyword를 현재 생성된 객체(const app = new App())로 명시해줘야 한다!!
    // this keyword = DOM element onto which object it is attached = form element => app object를 가리키지 않는다!
    // 이러한 부분들은 우리가 클래스 내에서 이벤트리스너의 this keyword를 다룰 때 항상 조심해야 하는 부분이다!
    // 사실, 실무에서는 클래스내에서 이벤트리스너를 다룰 땐 항상 this 키워드 상에서 bind method를 사용해야할 것..🌟 명심하자!!!!!

    inputType.addEventListener('change', this._toggleElevationField);
    // 6️⃣ _toggleElevationField() 메서드에 기존 함수 넣기
    // 이 함수 내에선 this keyword 사용하지 않기 때문에 bind method사용할 필요 ❌
  }

  // 1️⃣ getPosition 메서드에 우리가 이미 작성해놓은 코드 붙이기 + 첫번째 매개변수에 대한 함수의 바디를 loadMap 메서드에 따로 붙인 후, bind method를 활용해 연결하기.
  // 📌 233. How to use geolocation API? (=internalization, timer API in the browser)
  // But this is the ✨modern one✨ and very easy to use!!
  // 파라미터로 2개의 콜백함수를 받는데, 하나는 유저의 현재위치를 획득하는데 성공했을 때 콜되는 함수, 다른 하나는 데이터획득에 실패했을 때 실행되는 함수이다.
  _getPosition() {
    // Getting the user's current position using geolocation API
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // 💥1️⃣에러 해결 위해 Bind method로 this keyword = 현재 object를 가리키도록 해줌. (더 이상 undefined ❌)
        function () {
          alert('Could not get your position!');
        }
      );
  }

  // 1️⃣ 여기까지만 하면 아무일도 안일어난다. 단지 계획만 세운것일뿐! 이것들이 실제로 동작할 수 있게 실제 오브젝트를 만든 후, getPosition()를 불러와야 한다.
  // just a blueprint of a house until we make a class that creates objects holding the user's data from inputs.
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(latitude, longitude);

    const coords = [latitude, longitude];

    console.log(this);
    // 🚨4️⃣ undefined (In a regular function call, this keyword is set to undefined)
    // this._loadMap: 우리가 직접 부르는 함수가 아닌, getCurrentPosition()함수에 의해 불려진 콜백함수로서, 이 함수 자체는 method call이 아닌, regular function call으로 취급되기 때문에 undefined.
    // ✅ this 키워드를 명시적으로 정해주는 함수 메서드 배웠다. - 근데 여기선 함수를 불러오는 것(Call, apply)이 아닌, 함수 자체를 리턴하고 싶기 때문에 "bind"메서드를 이용해야겠지.
    // 10-Functions........................
    // ⭐️ bind: call method처럼 모든 함수의 this keyword를 set할 수 있게 allow하지만, call과의 차이점은 bind는 call처럼 바로 불러오지 않고 '새로운 함수를 return함으로써' 새로운 normal function을 만든 효과 -> parameter만 넣어 작용⭐️시킬 수 있다.

    // 235. Displaying a Map Marker
    // 밖에서 미리 선언해준 map 배리어블을 최초로 정의해줌!! (값 등록)
    // * L.map()의 파라미터에는 map이 그려질 html 요소의 id값과 동일해야 한다.
    this.#map = L.map('map').setView(coords, 13); // 💥1️⃣ 첫번째 에러 발생 // ⛳️
    // 1. map function의 파라미터: must be the ID name of an element in our HTML.
    // 2. L: Leaflet이 entry point로서 제공하는 main function (L namespace은 우리가 사용가능한 몇개의 메서드를 가지고, 그 중에 하나가 map, titleLayer, marker method인 것)
    // 3. setView의 두번째 매개변수: 얼마나 맵이 확대되어 나타나는지의 정도

    // 💥1️⃣ this상에 #map 프라퍼티 찾을 수 없다는 에러.
    // this._loadMap : Regular function call (Not a method call Cause we're not calling it ourselves)
    // Regular function call에서 This는 undefined라고 배웠기 때문에 여기서 This = undefined, undefined상에서 #map프라퍼티를 찾는 꼴이 됐으니 에러가 난 것!
    // 👉 bind method 사용하여 this keyword를 명시적으로 지정해주면 해결가능!😍

    // org -> fr/hot 변경하여 맵의 테마를 변경
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // console.log(map);
    // map 변수 상에서 이벤트리스너를 불러올 수 있기 때문에 저장한 거였다.
    // map은 "leaflet 라이브러리로부터 생성된 특별한 객체"이고, 이 객체 상에서 on 속성을 불러올 수 있다. (자바스크립트로부터 온 속성이 아니다!)
    // console.log(map); // 이 안에 'on' property가 존재하는 것을 확인할 수 있다.✅

    // 7️⃣ _showform()
    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this)); // ⛳️ //💥3️⃣ this keyword  will be set to the object onto which the event handler is attached.
    // 💥 this keyword -> bind method이용하여 제대로 된 this 키워드를 명시해주자...💥
    // 여기서 this = #map이기 때문에(on = addEventlistener) app obejct를 가리키도록 bind(this)해주자.
  }

  // 7️⃣ _showform()
  _showForm(mapE) {
    this.#mapEvent = mapE; // ⛳️
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Submitting a form = Creating a new workout
    // 폼을 제출한다는 것은 새로운 운동기록을 만든다는 뜻이니까!
    e.preventDefault();

    // Clear input fields
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    // console.log(mapEvent);
    const { lat, lng } = this.#mapEvent.latlng;

    L.marker([lat, lng])
      .addTo(map)
      .bindPopup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: 'running-popup',
      })
      .setPopupContent('Workout!')
      .openPopup();
  }
}

// data없이는 class App안에 있는 메서드들이 작동 안함!! (그것들은 단지 집을 짓기 우히ㅏㄴ blueprint같은 재료일뿐 알아서 실행되진 않는다!! => 일단 Object자체를 만들어줘야 함)
const app = new App();
// geolocation API를 Trigger하기 위해선 getPosition()메서드가 호출되어야 한다.
// 이걸 부르기 위해 다음과 같이 만들어놓은 객체(app) 상에 getPosition함수를 불러온다.
// 글로벌스콥에 부른 이유는 페이지가 로드되자마자 실행되야 하므로!
app._getPosition(); // ✨
// 근데, 이렇게 글로벌스콥에 쓰지 않고도 페이지가 로드되자마자 바로 실행되도록 클래스 내부에 짤 수 있는 방법이 있다.. 이게 훨씬 깔끔하고 보기 좋은 코드일것!
// app object가 만들어지자마자 실행되는 메서드가 있다. => 'constructor method'
// object는 어쩃든 이 constructor에 의해 만들어지는 것이기 때문에 "객체가 만들어진다?" = "constructor method가 실행된다" 이말과 동일...
