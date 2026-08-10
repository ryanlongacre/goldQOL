(async () => {
    const res = await fetch("https://my.sa.ucsb.edu/gold/WeeklyCartSchedule.aspx");
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, "text/html");

    const classes = doc.querySelector(".course-select-modal");


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
        if (event.target.tagName != "DIV") {
            console.log("Clicked the button");
        }
        else if (event.target.childElementCount === 1) {
            console.log("Wrong click");
            addNewEvent(event.target.parentNode);
        } else {
            console.log("Correct click");
            addNewEvent(event.target);
        }
    });

   const addNewEvent = (parentDiv) => {

        const [data] = Array.from(parentDiv.querySelectorAll("div")).map((i) => i.innerText);
        const [days, time, location] = data.split("\n");
        console.log(days);
        //days is M W, time is 11:30 AM-12:30 PM, location is just the location


        let targetDiv  = parentDiv;
        while (targetDiv.querySelector(".classTitle") === 'null') {
            targetDiv = targetDiv.parentNode;
        }
        const title = (targetDiv.innerText).split("\n")[0];
        console.log(title);

        console.log(days.split(" "));
        for (const day of days.split(" ")) {
            console.log(day);
            const queryString = "#pageContent_eventsgroup" + day;
            console.log(queryString);
            const targetCol = document.querySelector(queryString);
            targetCol.querySelector(".single-event-ul").appendChild(getNewElement(title, day, time, location));
        }        

        
   }






   


   
})();

//Want to make it so that you put in the string "9:30 AM", it outputs 90, cause thats 90 minutes away from 8
function getSeparation(time) {
    const [val, ap] = time.split(" ");
    const [hour, minute] = val.split(":").map(num => parseInt(num, 10));
    const adjustedHour = ap === "AM" ? hour : hour + 12;
    return (adjustedHour-8) * 60 + minute;
}

function getNewElement(title, day, time, location) {
    const sampleEvent = document.createElement("li");
    sampleEvent.className = "single-event";
    sampleEvent.dataset.day = day;
    console.log(time);
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

    return sampleEvent;
}