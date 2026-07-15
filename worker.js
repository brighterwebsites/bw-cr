import crmHTML from './crm.html';

export default {
  async fetch(request, env, ctx) {
    return new Response(crmHTML, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  },
};
