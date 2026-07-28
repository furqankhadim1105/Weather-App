// --- CONFIGURATION ---
const apiKey = "2d22e6ca31c6939d9a46391bcebc8462";
let currentWeatherData = null; 
let currentForecastData = null; 
let isCelsius = true;  

// Country Codes to Full Names Mapping
const countryNames = {
    "PK": "Pakistan",
    "IR": "Iran",
    "GB": "United Kingdom",
    "US": "United States",
    "IN": "India",
    "CA": "Canada",
    "AU": "Australia",
    "AE": "United Arab Emirates",
    "SA": "Saudi Arabia",
    "DE": "Germany",
    "FR": "France",
    "CN": "China",
    "JP": "Japan"
};

document.addEventListener("DOMContentLoaded", () => {
    if (!navigator.onLine) {
        alert("No internet connection! Please check your network connection.");
    }

    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("cityInput");
    const locBtn = document.getElementById("locBtn");
    const unitToggleBtn = document.getElementById("unitToggleBtn");
    const themeToggleBtn = document.getElementById("themeToggleBtn");

    loadRecentSearches();

    // AUTO-DETECT LOCATION ON APP LOAD
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            (error) => {
                showLoading(false);
                console.log("Location permission denied or unavailable.");
            }
        );
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => {
            const cityName = searchInput.value.trim();
            if (cityName !== "") {
                fetchWeatherByCityName(cityName);
                saveRecentSearch(cityName);
            } else {
                alert("Please enter a city name.");
            }
        });

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                searchBtn.click();
            }
        });
    }

    if (locBtn) {
        locBtn.addEventListener("click", getWeatherByCurrentLocation);
    }

    if (unitToggleBtn) {
        unitToggleBtn.addEventListener("click", () => {
            isCelsius = !isCelsius;
            if (currentWeatherData) displayCurrentWeather(currentWeatherData);
            if (currentForecastData) {
                displayForecast(currentForecastData);
                displayHourlyForecast(currentForecastData);
            }
        });
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const htmlElement = document.documentElement;
            htmlElement.classList.toggle("dark");
            
            if (htmlElement.classList.contains("dark")) {
                themeToggleBtn.innerText = "☀️ Light";
            } else {
                themeToggleBtn.innerText = "🌙 Dark";
            }
        });
    }
});

// Recent Searches Management (LocalStorage)
function saveRecentSearch(city) {
    let searches = JSON.parse(localStorage.getItem('recentWeatherCities')) || [];
    let formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    
    if (!searches.includes(formattedCity)) {
        searches.unshift(formattedCity);
        if (searches.length > 4) searches.pop();
        localStorage.setItem('recentWeatherCities', JSON.stringify(searches));
        loadRecentSearches();
    }
}

function loadRecentSearches() {
    const container = document.getElementById("recentContainer");
    if (!container) return;
    container.innerHTML = "";
    
    let searches = JSON.parse(localStorage.getItem('recentWeatherCities')) || [];
    if (searches.length > 0) {
        const label = document.createElement("span");
        label.className = "text-gray-500 dark:text-gray-400 self-center mr-1 font-medium";
        label.innerText = "Recent:";
        container.appendChild(label);

        searches.forEach(city => {
            const chip = document.createElement("button");
            chip.className = "bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-gray-600 hover:bg-blue-100 transition";
            chip.innerText = city;
            chip.addEventListener("click", () => {
                document.getElementById("cityInput").value = city;
                fetchWeatherByCityName(city);
            });
            container.appendChild(chip);
        });
    }
}

// Search by City Name with validation
function fetchWeatherByCityName(city) {
    showLoading(true);
    let originalInput = city.trim();
    let queryParam = originalInput;

    const internationalCities = ["london", "new york", "tokyo", "paris", "dubai", "toronto", "sydney", "mumbai", "delhi", "mecca", "medina", "tehran"];
    const isIntl = internationalCities.some(c => queryParam.toLowerCase().includes(c));

    if (!isIntl && !queryParam.toLowerCase().includes(",pk")) {
        queryParam = `${queryParam},pk`;
    }

    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryParam)}&units=metric&appid=${apiKey}`;

    fetch(currentWeatherUrl)
        .then(response => {
            if (!response.ok) {
                if (!isIntl && queryParam.endsWith(",pk")) {
                    const fallbackUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(originalInput)}&units=metric&appid=${apiKey}`;
                    return fetch(fallbackUrl).then(res => {
                        if (!res.ok) throw new Error("City not found");
                        return res.json();
                    });
                }
                throw new Error("City not found");
            }
            return response.json();
        })
        .then(data => {
            currentWeatherData = data;
            displayCurrentWeather(data);
            fetchForecastByCoords(data.coord.lat, data.coord.lon);
            showLoading(false);
        })
        .catch(err => {
            showLoading(false);
            alert("This city was not found in the weather database. Please enter a valid city name!");
        });
}

// Current Location GPS Button
function getWeatherByCurrentLocation() {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                showLoading(false);
                alert("Location access denied. Please allow location permissions.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

function fetchWeatherByCoords(lat, lon) {
    showLoading(true);
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    fetch(currentWeatherUrl)
        .then(response => response.json())
        .then(data => {
            currentWeatherData = data;
            displayCurrentWeather(data);
            document.getElementById("cityInput").value = data.name;
            saveRecentSearch(data.name);
            showLoading(false);
        })
        .catch(err => {
            showLoading(false);
            console.error("Error: ", err);
        });

    fetchForecastByCoords(lat, lon);
}

function fetchForecastByCoords(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    fetch(forecastUrl)
        .then(response => response.json())
        .then(data => {
            currentForecastData = data;
            displayForecast(data);
            displayHourlyForecast(data);
        })
        .catch(err => console.error("Forecast Error: ", err));
}

function showLoading(show) {
    const loadingEl = document.getElementById("loading");
    if (loadingEl) {
        if (show) loadingEl.classList.remove("hidden");
        else loadingEl.classList.add("hidden");
    }
}

// Display Current Weather & Stats
function displayCurrentWeather(data, customDateText = null, isForecastDay = false) {
    const weatherResult = document.getElementById("weatherResult");
    const cityNameEl = document.getElementById("cityName");
    const tempEl = document.getElementById("temp");
    const descriptionEl = document.getElementById("description");
    const iconContainer = document.getElementById("weatherIconContainer");
    const bodyBg = document.getElementById("bodyBg");
    
    const feelsLikeEl = document.getElementById("feelsLike");
    const humidityEl = document.getElementById("humidity");
    const windSpeedEl = document.getElementById("windSpeed");
    const pressureEl = document.getElementById("pressure");
    const sunriseTimeEl = document.getElementById("sunriseTime");
    const sunsetTimeEl = document.getElementById("sunsetTime");
    const weatherTipEl = document.getElementById("weatherTip");
    const hourlyContainer = document.getElementById("hourlyContainer");

    const countryCode = data.sys.country;
    const fullCountryName = countryNames[countryCode] || countryCode;
    cityNameEl.innerText = `${data.name}, ${fullCountryName}`;

    const tempC = data.main.temp;
    const feelsC = data.main.feels_like !== undefined ? data.main.feels_like : tempC;

    if (isCelsius) {
        tempEl.innerText = `${Math.round(tempC)}°C`;
        feelsLikeEl.innerText = `${Math.round(feelsC)}°C`;
    } else {
        const tempF = (tempC * 9/5) + 32;
        const feelsF = (feelsC * 9/5) + 32;
        tempEl.innerText = `${Math.round(tempF)}°F`;
        feelsLikeEl.innerText = `${Math.round(feelsF)}°F`;
    }

    humidityEl.innerText = `${data.main.humidity}%`;
    windSpeedEl.innerText = data.wind ? `${Math.round(data.wind.speed * 3.6)} km/h` : "N/A";
    pressureEl.innerText = `${data.main.pressure} hPa`;

    const weatherMainCheck = data.weather[0].main.toLowerCase();

    let adviceText = "🌤️ Great weather to go outside!";
    if (weatherMainCheck.includes("rain")) {
        adviceText = "🌧️ Don't forget to carry an umbrella!";
    } else if (weatherMainCheck.includes("clear")) {
        adviceText = "☀️ The weather is clear, wear a cap or sunglasses to protect from the sun.";
    } else if (weatherMainCheck.includes("snow")) {
        adviceText = "❄️ It's quite cold outside, wear warm clothes!";
    }

    if (isForecastDay) {
        weatherTipEl.innerText = `📅 ${customDateText} Advice: ${adviceText}`;
        
        // Custom message for sunrise and sunset on future days
        sunriseTimeEl.innerText = "Only for Today";
        sunsetTimeEl.innerText = "Only for Today";

        // Message for hourly forecast
        hourlyContainer.innerHTML = `<p class="text-xs text-gray-500 dark:text-gray-400 py-2 w-full text-center col-span-full">Hourly forecast is only available for Today.</p>`;
    } else {
        weatherTipEl.innerText = adviceText;

        if (currentWeatherData && currentWeatherData.sys && currentWeatherData.sys.sunrise && currentWeatherData.sys.sunset) {
            const formatTime = (timestamp) => {
                const date = new Date(timestamp * 1000);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };
            sunriseTimeEl.innerText = formatTime(currentWeatherData.sys.sunrise);
            sunsetTimeEl.innerText = formatTime(currentWeatherData.sys.sunset);
        } else {
            sunriseTimeEl.innerText = "N/A";
            sunsetTimeEl.innerText = "N/A";
        }

        if (currentForecastData) {
            displayHourlyForecast(currentForecastData);
        }
    }
    
    if (customDateText) {
        descriptionEl.innerText = `${customDateText} - ${data.weather[0].description}`;
    } else {
        const todayString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        descriptionEl.innerText = `${todayString} - ${data.weather[0].description}`;
    }
    
    const iconCode = data.weather[0].icon;
    iconContainer.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@4x.png" alt="Icon" class="w-20 h-20">`;

    if (weatherMainCheck.includes("rain") || weatherMainCheck.includes("drizzle")) {
        bodyBg.className = "bg-gradient-to-br from-slate-700 via-gray-800 to-zinc-900 flex items-center justify-center min-h-screen transition-all duration-700 ease-in-out p-4";
    } else if (weatherMainCheck.includes("cloud") || weatherMainCheck.includes("overcast")) {
        bodyBg.className = "bg-gradient-to-br from-slate-500 via-sky-600 to-blue-700 flex items-center justify-center min-h-screen transition-all duration-700 ease-in-out p-4";
    } else if (weatherMainCheck.includes("clear")) {
        bodyBg.className = "bg-gradient-to-br from-amber-400 via-orange-500 to-blue-600 flex items-center justify-center min-h-screen transition-all duration-700 ease-in-out p-4";
    } else if (weatherMainCheck.includes("snow")) {
        bodyBg.className = "bg-gradient-to-br from-slate-200 via-blue-200 to-sky-400 flex items-center justify-center min-h-screen transition-all duration-700 ease-in-out p-4";
    } else {
        bodyBg.className = "bg-gradient-to-br from-blue-400 to-sky-600 flex items-center justify-center min-h-screen transition-all duration-700 ease-in-out p-4";
    }

    weatherResult.classList.remove("hidden");
}

// Hourly Forecast Display
function displayHourlyForecast(data) {
    const hourlyContainer = document.getElementById("hourlyContainer");
    hourlyContainer.innerHTML = "";

    const hourlyList = data.list.slice(0, 6);

    hourlyList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const tempC = Math.round(item.main.temp);
        const tempF = Math.round((tempC * 9/5) + 32);
        const tempDisplay = isCelsius ? `${tempC}°C` : `${tempF}°F`;
        const icon = item.weather[0].icon;

        const card = document.createElement("div");
        card.className = "flex flex-col items-center bg-white/70 dark:bg-gray-700/70 p-2 rounded-xl min-w-[70px] border dark:border-gray-600 text-xs shadow-sm";
        card.innerHTML = `
            <span class="text-gray-500 dark:text-gray-300 font-medium">${timeString}</span>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon" class="w-8 h-8 my-0.5">
            <span class="font-bold text-blue-600 dark:text-blue-300">${tempDisplay}</span>
        `;
        hourlyContainer.appendChild(card);
    });
}

// 5-Day Forecast
function displayForecast(data) {
    const forecastContainer = document.getElementById("forecastContainer");
    forecastContainer.innerHTML = "";

    const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);

    dailyForecasts.forEach((day, index) => {
        const date = new Date(day.dt * 1000);
        let dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (index === 0) {
            dayName = "Today";
        }

        const fullDateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        const tempC = Math.round(day.main.temp);
        const tempF = Math.round((tempC * 9/5) + 32);
        const tempDisplay = isCelsius ? `${tempC}°C` : `${tempF}°F`;
        const icon = day.weather[0].icon;

        const forecastItem = document.createElement("div");
        forecastItem.className = "flex items-center justify-between bg-white/80 dark:bg-gray-700/85 p-2 rounded-xl shadow-sm text-sm border dark:border-gray-600 text-gray-800 dark:text-gray-100 transition-all hover:scale-[1.02] cursor-pointer hover:border-blue-500";
        
        forecastItem.innerHTML = `
            <span class="font-bold w-16">${dayName}</span>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon" class="w-8 h-8">
            <span class="capitalize text-xs opacity-80 truncate max-w-[100px]">${day.weather[0].description}</span>
            <span class="font-extrabold text-blue-600 dark:text-blue-300">${tempDisplay}</span>
        `;

        forecastItem.addEventListener("click", () => {
            if (index === 0) {
                displayCurrentWeather(currentWeatherData, null, false);
                displayHourlyForecast(currentForecastData);
            } else {
                const selectedDayData = {
                    ...currentWeatherData,
                    main: day.main,
                    weather: day.weather,
                    wind: day.wind
                };
                displayCurrentWeather(selectedDayData, fullDateStr, true);
            }
        });

        forecastContainer.appendChild(forecastItem);
    });
}