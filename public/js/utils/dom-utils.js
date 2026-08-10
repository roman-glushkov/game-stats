export class DomUtils {
  $(selector) {
    return document.querySelector(selector);
  }
  $$(selector) {
    return document.querySelectorAll(selector);
  }
  byId(id) {
    return document.getElementById(id);
  }
}
