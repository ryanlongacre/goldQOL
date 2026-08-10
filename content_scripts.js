(async () => {
    const res = await fetch("https://my.sa.ucsb.edu/gold/WeeklyCartSchedule.aspx");
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, "text/html");

    const classes = doc.querySelector(".course-select-modal");


    document.getElementsByClassName("wk-schedule js-full")[0].appendChild(document.importNode(classes, true));

    /*
    note: the id is 52795T930, and T is the day of the week its on, and 930 is the start time. don't know what 52979 is
    note: also, for the data- things, syntax is object.dataset.day = 'x'; generates data-day = 'x';
    note: there is a ul in the original li, the id is pageContent_eventsGroupM or T or W or R or F depending on day of the week, so will have to be dynamic
    setup of the event in the calendar
    note: the position of the thing is entirely determined by the style: top: 0px part. 
    note: I think the position value is entirely dependent on the time from 8 oclock in minutes. so i just need to get that. 
    note: the id is probably just an identifier to add/remove each one which will be useful for me
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
   const sampleEvent = document.createElement("li");

   sampleEvent.className = "single-event";
   sampleEvent.dataset.day = "T";
   sampleEvent.dataset.start = "01:00 PM";
   sampleEvent.dataset.end = "01:45 PM";
   sampleEvent.dataset.content = "CMPSC 156";
   sampleEvent.dataset.event = "ILP 2201";
   sampleEvent.style="top: 315px; height: 75px;";

   const innerElement = document.createElement("a");
   
   const innerTitle = document.createElement("h1");
   const innerLocation = document.createElement("h2");
   const innerTime = document.createElement("p");

   innerTitle.className = "event-name";
   innerTitle.innerText = "CMPSC 156";
   
   innerLocation.className = "event-location";
   innerLocation.innerText = "ILP 2201";
   
   innerTime.innerText = "1:00 PM - 1:45PM";

   innerElement.appendChild(innerTitle);
   innerElement.appendChild(innerLocation);
   innerElement.appendChild(innerTime);

   sampleEvent.appendChild(innerElement);

   targetCol = document.querySelector("#pageContent_eventsgroupT");
   targetCol.querySelector(".single-event-ul").appendChild(sampleEvent);
   
   console.log(sampleEvent.innerHTML);





   


   
})();