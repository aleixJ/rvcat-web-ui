<script setup>
  import headerComponent from '@/components/headerComponent.vue';
</script>

<template>
  <body>
    <header>
      <headerComponent />
    </header>
    <main>
        <article>
            <h1>About</h1>

            <p>
                RVCAT (RISC-V Code Analysis Tool) is a simulation tool for the performance analysis of small programs from a computer architecture educational standpoint.
            </p>
            <p>
                RVCAT and its web interface (RVCAT-Web) have been developed on
                the Computer Architecture and Operating Systems Department of
                the Universitat Autònoma de Barcelona (UAB) by Saul Adserias,
                Quim Aguado Puig, and Juan C. Moure.
            </p>
            <p>
                The simulator and web interface are still under active
                development. If you find any bugs or want to help improving the
                tools (for example, as part of a final degree project), please
                contact your professors.
            </p>

        </article>
    </main>
  </body>
</template>

<style scoped>
article {
    margin: 0 auto;
    max-width: 650px;
    padding: 1em;
}
</style>
