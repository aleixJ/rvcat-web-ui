<template>
  <div id="top">
    <div>
      <h1>RVCAT-Web</h1>
    </div>
    <nav>
      <ul>
        <li><a><RouterLink :to="{ name: 'simulator' }">Simulator</RouterLink></a></li>
        <li><a><RouterLink :to="{ name: 'about' }">About</RouterLink></a></li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
 #top {
    height: 5vh;
    max-height: 40px;
    width:100vf;
    padding: 0.6%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #007acc;
    color: white !important;
    padding: 15px 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    box-sizing: border-box; /* Ensure consistent sizing */
  }

  h1 {
      margin: 0;
      font-size: 20px;
  }

  h2 {
      margin: 0;
      font-size: small;
      font-style: italic;
      font-weight: normal;
  }

  a {
      color: white;
      text-decoration: none;
      font-size: 14px;
  }
  a:hover {
      text-decoration: underline;
  }

  nav {
      background-color: #007acc;
      color: white;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
  }

  ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
  }

  ul li {
      margin: 0 10px;
  }


</style>
