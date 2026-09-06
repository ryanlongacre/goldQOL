(async () => {
    const res = await fetch("https://my.sa.ucsb.edu/gold/WeeklyCartSchedule.aspx");
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, "text/html");

    const classes = doc.querySelector(".course-select-modal");

    //current: just the five digit code
    chrome.storage.local.set({'current': []});

    //times: [five digit code + day of week + start time (no colon, no AM/PM), day of week + ~ + start time full-end time full]
    chrome.storage.local.set({'times' : []});

    chrome.storage.local.set({'overlaps':  []});

    const container = document.createElement('div');
    container.className = "course-select-container row";
    container.style = "display: inline-flex; width: inherit;";


    document.getElementById('schedule-screenshot').parentNode.appendChild(container);
    container.appendChild(document.importNode(classes, true));

    const correctModal = document.getElementsByClassName('course-select-modal');
    correctModal.className = correctModal.className + " col-lg-4 col-md-4";

    //elements can only exist in one place at once, so inserting it somewhere moves it from the other place
    const table = document.getElementsByClassName('capture')[0];
    table.className = table.className + " col-xl-12 col-md-12"
    container.prepend(table);

    initiateSpace();




    //document.getElementsByClassName("wk-schedule js-full")[0].appendChild(document.importNode(classes, true));

    const customStyles = document.createElement("link");
    customStyles.rel = "stylesheet";
    customStyles.href = chrome.runtime.getURL("custom.css");

    document.getElementsByTagName("head")[0].appendChild(customStyles);


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

    const targetCols = ['M', 'T', 'W', 'R', 'F'];

    const initialResults = await chrome.storage.local.get('times');
    const currentTimes = initialResults.times || [];

    let updatedTimes = [...currentTimes];

    for (const col of targetCols) {
        const column = document.getElementById("pageContent_eventsgroup" + col);
        const items = column.getElementsByClassName('single-event');
        for (const item of items) {

            const code = item.id.slice(1,6);
            const startShort = item.dataset.start.split(" ")[0].split(":").join("");
            const firstElement = code + col + startShort;
            const secondElement = col + '~' + item.dataset.start + '-' + item.dataset.end;
            updatedTimes.push([firstElement, secondElement]);
        }


    }

    await chrome.storage.local.set({times: updatedTimes});

    


    const modal = document.querySelector(".course-select-modal");
    modal.addEventListener("click", async (event) => {
        let targetDiv = event.target;
        //this can be improved hella with closest() but idc
        if (event.target.tagName != "DIV") {
            return;
        } else if (event.target.innerHTML.includes("top-row-inner-regcart")) {
            targetDiv = event.target.parentNode.getElementsByClassName("top-row-inner-regcart")[0].children[0];
        } else {
            while (targetDiv.className !== "top-row-inner-regcart") {
                targetDiv = targetDiv.parentNode;
            }
            targetDiv = targetDiv.children[0];
        }
        //is a section    
        //this can be improved hella with closest() but idc
        if (targetDiv.parentNode.parentNode.parentNode.parentNode.parentNode.className === "scheduleItem sectionSelect secondarySection") {
            const lectureDiv = targetDiv.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
            const lectureInfoDiv = lectureDiv.getElementsByClassName("top-row-inner-regcart")[0].children[0];
            const [title, code] = getInfo(lectureInfoDiv);

            const { current = [] } = await chrome.storage.local.get('current');
            if (!current.includes(code)) {
                await addNewEvent(lectureInfoDiv);
            }
        }
        await addNewEvent(targetDiv);


        
    });

    //I think the best move for the future is to implement a helper function that returns information about the class
    //would return title, code, days, time, location, given that one div that has all of that

    const addNewEvent = async (parentDiv) => {

        //how am i going to go about doing this. i think i have to keep a list of times that have been taken
        //but then I will also need to keep track of what class that time belongs to so I can assign the right id
        //and also can remove when needed
    

        const result = await chrome.storage.local.get('current');
        const currentList = result.current || [];

        const res = await chrome.storage.local.get('times');
        const currentTimes = res.times || [];

        const [title, code, days, time, location] = getInfo(parentDiv);
        const [start, end] = time.split("-").map(num => getSeparation(num));

        

        
        //remove if already clicked
        if (currentList.includes(code)) {
            //Code to remove is code, day, then time
            let updatedTimes = [...currentTimes];
            
            let target = parentDiv;
            while (target.className !== "row info gridDisplay") {
                target = target.parentNode;
            }
            target.parentNode.className = target.parentNode.className.split(" ")[0];

            const { overlaps } = await chrome.storage.local.get('overlaps');
            const currentOverlaps = new Map(overlaps);
            for (const day of days.split(" ")) {
                const idOfElem = code + day + time.split("-")[0].split(" ")[0].split(":").join(""); 
                const elementToRemove = document.getElementById(idOfElem);
                elementToRemove.parentNode.removeChild(elementToRemove);
                updatedTimes = updatedTimes.filter(item => item[0] !== idOfElem);

                const mainOverlaps = currentOverlaps.get(idOfElem) || [];
                console.log(mainOverlaps);
                for (const item of mainOverlaps) {
                    currentOverlaps.set(item, [...currentOverlaps.get(item).filter(item => item != idOfElem)]);
                }
                currentOverlaps.delete(idOfElem);

                
            }
            for ([key, value] of currentOverlaps) {
                if (value.length === 0) {
                    currentOverlaps.delete(key);
                }
            }
            await chrome.storage.local.set({times: updatedTimes});
            
            const updatedList = currentList.filter(item => item !== code);
            await chrome.storage.local.set({ current: updatedList });


            await chrome.storage.local.set({ overlaps: [...currentOverlaps]});  

                
        } else {
            //not currently there so add it
            currentList.push(code);
            let target = parentDiv;
            while (target.className !== "row info gridDisplay") {
                target = target.parentNode;
            }
            target.parentNode.className = target.parentNode.className + " clicked";
            
            await chrome.storage.local.set({current: currentList});
            for (const day of days.split(" ")) {
                const idOfElem = code + day + time.split("-")[0].split(" ")[0].split(":").join("");
                currentTimes.push([idOfElem, day + "~" + time]);
                const queryString = "#pageContent_eventsgroup" + day;
                const targetCol = document.querySelector(queryString);
                targetCol.querySelector(".single-event-ul").appendChild(getNewElement(code, day, time, location, title));

                //overlap: rightConflict or leftConflict
            }
            await chrome.storage.local.set({times: currentTimes});    
            const { overlaps } = await chrome.storage.local.get('overlaps');
            const currentOverlaps = new Map(overlaps);
            for (const [idCurr, timeCurr] of currentTimes) {
                const s = timeCurr.split("-")[0];
                const [dayI, s2] = s.split("~");
                const startI = getSeparation(s2);
                const endI = getSeparation(timeCurr.split("-")[1]);
                
                for (const day of days.split(" ")) {
                    const idOfElem = code + day + time.split("-")[0].split(" ")[0].split(":").join(""); 
                    if (day !== dayI) {
                        continue;
                    }
                    if (idCurr === idOfElem) {
                        continue;
                    }
                    if ((start > startI) && (start < endI)) {
                        console.log("Scenario 1");
                        currentOverlaps.set(idCurr, [...currentOverlaps.get(idCurr) ?? [], idOfElem])
                        currentOverlaps.set(idOfElem, [...currentOverlaps.get(idOfElem) ?? [], idCurr])
                    } else if ((end > startI) && (end < endI)) {
                        console.log("Scenario 2");
                        currentOverlaps.set(idCurr, [...currentOverlaps.get(idCurr) ?? [], idOfElem])
                        currentOverlaps.set(idOfElem, [...currentOverlaps.get(idOfElem) ?? [], idCurr])
                    } else if ((start <= startI) && (end >= endI)) {
                        console.log("Scenario 3");
                        currentOverlaps.set(idCurr, [...currentOverlaps.get(idCurr) ?? [], idOfElem])
                        currentOverlaps.set(idOfElem, [...currentOverlaps.get(idOfElem) ?? [], idCurr])
                    }
                }
                    
            }
                

            await chrome.storage.local.set({ overlaps: [...currentOverlaps]});  

        }

        //this is the code for when the element is being added to the page
        //when the element is being removed from the page, need to check all overlaps it is a part of, and remove itself from those
        //lowkey shouldn't be very difficult
          
        
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
    //sections have a height of 50px and lectures have a height of 75px
    const sampleEvent = document.createElement("li");
    sampleEvent.className = "single-event custom";
    sampleEvent.dataset.day = day;
    const [start, end] = time.split("-");
    sampleEvent.dataset.start = start;
    sampleEvent.dataset.end = end;
    const classLength = getSeparation(end) - getSeparation(start);
    sampleEvent.dataset.content = title;
    sampleEvent.dataset.event = location;
    sampleEvent.style= "top: " + getSeparation(start, 8) + "px; height: " + classLength + "px;";

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

function getInfo(d) {
    const [data] = Array.from(d.querySelectorAll("div")).map((i) => i.innerText);
    const [days, time, location] = data.split("\n");
    //days is M W, time is 11:30 AM-12:30 PM, location is just the location


    let targetDiv = d;
    const code = (targetDiv.innerText).split("\n")[0];
    let i = 1;
    while (targetDiv.className !== "scheduleItem") {
        targetDiv = targetDiv.parentNode;
        i += 1;
    }
    targetDiv = targetDiv.getElementsByClassName('courseTitle')[0].querySelectorAll('[id*="Id"]')[0];
    const title = targetDiv.innerText;
    return [title, code, days, time, location];  
}

async function initiateSpace() {
    const modal = document.getElementsByClassName('course-select-modal')[0];
    const scheduleItems = modal.children;
    const codes = [];
    const pairs = [];
    for (const item of [...scheduleItems].slice(1)) {
        const target = item.children[1].getElementsByClassName('sectionSelect')[0];
        const data = await fetchData(target.dataset.enrollcode);
        codes.push(...data.codes);
        for (let i = 0; i < data.enrolled.length; i++) {
            pairs.push([data.enrolled[i], data.space[i]]);
        }
    }
    const dict = Object.fromEntries(
        codes.map((key, index) => [key, pairs[index]])
    );

    const targets = document.querySelectorAll('[data-enrollcode]');
    for (const target of targets) {
        if (dict[target.dataset.enrollcode][0] === dict[target.dataset.enrollcode][1]) {
            target.className = target.className + " full";
        }
    }

    console.log(dict);
}

async function fetchData(code) {
    const url = `http://localhost:8080/space/`;
    try {
        const response = await fetch(
            url + code,
            {
                method: "POST",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );

        if (!response.ok) {
            console.log('yeah idk it didn\'t work');
        }

        const data = await response.json();

        return data;
    } catch (err) {
        console.error(err);
    }
}