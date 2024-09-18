  /* Toggle between showing and hiding the navigation menu links when the user clicks on the hamburger menu icon */
  function toggleMobileMenu() {

    var menuLinks = document.getElementById("menulinks");
    var menuIcon = document.getElementById("menuIcon");
    var closeIcon = document.getElementById("closeIcon");

    if (menuLinks.style.display === "block") {
        menuLinks.style.display = "none";
        closeIcon.style.display = "none";
        menuIcon.style.display = "block";
    } else {
        menuLinks.style.display = "block";
        closeIcon.style.display = "block";
        menuIcon.style.display = "none";
    }
  } 

// // Menu toggling script
  // const movablemenu = document.querySelector("menuslider");
  // const menuItems = document.querySelectorAll(".menuItem");
  // const hamburger = document.querySelector("hamburgerbutton");
  // const closeIcon = document.querySelector(".closeIcon");
  // const menuIcon = document.querySelector(".menuIcon");

  // function toggleMenu() {
  //   if (movablemenu.classList.contains("showMenu")) {
  //     movablemenu.classList.remove("showMenu");
  //     closeIcon.style.display = "none";
  //     menuIcon.style.display = "block";
  //   } else {
  //     movablemenu.classList.add("showMenu");
  //     closeIcon.style.display = "block";
  //     menuIcon.style.display = "none";
  //   }
  // }

  // hamburger.addEventListener("click", toggleMenu);
  
  // // Hide menu if a menu item has been clicked
  // menuItems.forEach( 
  //   function(menuItem) { 
  //     menuItem.addEventListener("click", toggleMenu);
  //   }
  // )  