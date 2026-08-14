(async () => {
    const res = await fetch("https://my.sa.ucsb.edu/gold/WeeklyCartSchedule.aspx");
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, "text/html");

    const classes = doc.querySelector(".course-select-modal");

    chrome.storage.local.set({'current': []})


    document.getElementsByClassName("wk-schedule js-full")[0].appendChild(document.importNode(classes, true));

    /*
    note: the id is 52795T930, and T is the day of the week its on, and 930 is the start time. don't know what 52979 is: its the like enroll code or smth on the thing
    note: also, for the data- things, syntax is object.dataset.day = 'x'; generates data-day = 'x';
    note: there is a ul in the original li, the id is pageContent_eventsGroupM or T or W or R or F depending on day of the week, so will have to be dynamic
    setup of the event in the calendar
    note: the position of the thing is entirely determined by the style: top: 0px part. 
    note: I think the position value is entirely dependent on the time from 8 oclock in minutes. so i just need to get that. 
    note: the id is probably just an identifier to add/remove each one which will be useful for me
    note: class for the lecture part: sectionSelect, class for that ones sections is sections. both of these are under scheduleItem
    note: the scheduleItem div is the event.parentNode.parentNode.parentNode but thats not what im clicking on
    <li class="single-event" id="something" data-day="T" data-start="9:30 AM" 
        data-end="10:45 AM" data-content="CMPSC   134 " data-event="ILP 3314" 
        style="top: 90px; height: 75px
    >
        <a>
            <h1 id="h1c<something" class="event-name"> CMPSC 134 </h1>
            <h2 id="h2c<something" class="event-location">ILP 3314</h2>
            <p id="pcsomething">9:30 AM-10:45 AM</p>
        </a>
    </li>
    */


    const modal = document.querySelector(".course-select-modal");
    modal.addEventListener("click", (event) => {
        let targetDiv = event.target;
        if (event.target.tagName != "DIV") {
            console.log("Clicked the button");
            return;
        } else if (event.target.innerHTML.includes("top-row-inner-regcart")) {
            targetDiv = event.target.parentNode.getElementsByClassName("top-row-inner-regcart")[0].children[0];
        } else {
            while (targetDiv.className !== "top-row-inner-regcart") {
                targetDiv = targetDiv.parentNode;
                console.log(targetDiv.className);
            }
            targetDiv = targetDiv.children[0];
        }

        addNewEvent(targetDiv);
        console.log(targetDiv.outerHTML);
    });

   const addNewEvent = async (parentDiv) => {

        const [data] = Array.from(parentDiv.querySelectorAll("div")).map((i) => i.innerText);
        const [days, time, location] = data.split("\n");
        //days is M W, time is 11:30 AM-12:30 PM, location is just the location


        let targetDiv = parentDiv;
        const code = (targetDiv.innerText).split("\n")[0];
        let i = 1;
        while (targetDiv.className !== "scheduleItem") {
            targetDiv = targetDiv.parentNode;
            i += 1;
        }
        targetDiv = targetDiv.getElementsByClassName('courseTitle')[0].querySelectorAll('[id*="Id"]')[0];
        const title = targetDiv.innerText;
        console.log(targetDiv.innerText);

        const result = await chrome.storage.local.get('current');
        const currentList = result.current || [];

        if (currentList.includes(code)) {
            //Code to remove is code, day, then time
            for (const day of days.split(" ")) {
                const idOfElem = code + day + time.split("-")[0].split(" ")[0].split(":").join("");
                const elementToRemove = document.getElementById(idOfElem);
                elementToRemove.parentNode.removeChild(elementToRemove);
            }
            
            chrome.storage.local.get('current', (l) => {
                let currentList = l.current || [];

                let updatedList = currentList.filter(item => item !== code);

                chrome.storage.local.set({'current': updatedList}, () => {
                    console.log(updatedList);
                })
            })

                
        } else {
            chrome.storage.local.get('current', (l) => {
                let currentList = l.current || [];

                currentList.push(code);

                chrome.storage.local.set({current: currentList}, () => {
                    console.log("List updated");
                })

                for (const day of days.split(" ")) {
                    const queryString = "#pageContent_eventsgroup" + day;
                    const targetCol = document.querySelector(queryString);
                    targetCol.querySelector(".single-event-ul").appendChild(getNewElement(code, day, time, location, title));
                }
            })    
        }
        
   }  
})();

//Want to make it so that you put in the string "9:30 AM", it outputs 90, cause thats 90 minutes away from 8
function getSeparation(time) {
    const [val, ap] = time.split(" ");
    const [hour, minute] = val.split(":").map(num => parseInt(num, 10));
    const adjustedHour = ap === "AM" ? hour : hour + 12;
    const realHour = adjustedHour === 24 ? 12 : adjustedHour;
    return (realHour-8) * 60 + minute;
}

function getNewElement(code, day, time, location, title) {
    const sampleEvent = document.createElement("li");
    sampleEvent.className = "single-event";
    sampleEvent.dataset.day = day;
    const [start, end] = time.split("-");
    sampleEvent.dataset.start = start;
    sampleEvent.dataset.end = end;
    sampleEvent.dataset.content = title;
    sampleEvent.dataset.event = location;
    sampleEvent.style= "top: " + getSeparation(start) + "px; height: 75px;";

    const innerElement = document.createElement("a");
    
    const innerTitle = document.createElement("h1");
    const innerLocation = document.createElement("h2");
    const innerTime = document.createElement("p");

    innerTitle.className = "event-name";
    innerTitle.innerText = title;
    
    innerLocation.className = "event-location";
    innerLocation.innerText = location;
    
    innerTime.innerText = time;

    innerElement.appendChild(innerTitle);
    innerElement.appendChild(innerLocation);
    innerElement.appendChild(innerTime);

    sampleEvent.appendChild(innerElement);

    sampleEvent.id = code + day + start.split(" ")[0].split(":").join("");

    return sampleEvent;
}