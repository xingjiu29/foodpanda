const url = $request.url;
const body = $response.body;
const DROP_SWIMLANE = /past_order|new-restaurants|meal_for_one|low_delivery|lowest_delivery|top_chain|deals_multi_vendors|fresh-grocery|discounts_deals|pro_deals|deals_and_new_vendors|popular_shops|sponsored_vendors|popular_restaurants|daily_essentials|featured-restaurants|popular-qc-vendor|^auto-product-|NEW_TO_QC|nested_product|pandadeal|lobang|time_based/;
const KEEP_FE = ["FILTERS"];
function isDrop(c) {
  const t = c.__typename;
  if (t === "CampaignCarouselComponent") return true;
  if (t === "HomePageFrontendComponent" || t === "VendorListingPageFrontendComponent") {
    return KEEP_FE.indexOf(String(c.type)) < 0;
  }
  if (t === "PopularSearchesComponent") return true;
  if (t === "SwimlaneComponent") return DROP_SWIMLANE.test(String(c.id || ""));
  return false;
}
let removed = 0;
function clean(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) clean(node[i]);
    return;
  }
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = node[k];
    if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === "object" && v[0].__typename) {
      node[k] = v.filter(function (x) {
        if (isDrop(x)) {
          removed++;
          return false;
        }
        return true;
      });
    }
    clean(node[k]);
  }
}
if (!body || !/\/graphql/.test(url) || !/query=(HomeFeed|ShopListingPage|PreSearchPage)/.test(url)) {
  $done({});
} else {
  let j = null;
  try {
    j = JSON.parse(body);
  } catch (e) {
    j = null;
  }
  if (!j) {
    $done({});
  } else {
    clean(j);
    console.log("FP " + url.split("query=")[1].split("&")[0] + " removed=" + removed);
    $done({ body: JSON.stringify(j) });
  }
}
