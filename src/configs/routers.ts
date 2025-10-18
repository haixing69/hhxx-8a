import INDEX from '../pages/index.jsx';
import STRATEGY_DETAIL from '../pages/strategy-detail.jsx';
import STRATEGY_EDIT from '../pages/strategy-edit.jsx';
import API_CONFIG from '../pages/api-config.jsx';
import STRATEGY_CREATE-LIVE from '../pages/strategy-create-live.jsx';
import STRATEGY_CREATE-BACKTEST from '../pages/strategy-create-backtest.jsx';
export const routers = [{
  id: "index",
  component: INDEX
}, {
  id: "strategy-detail",
  component: STRATEGY_DETAIL
}, {
  id: "strategy-edit",
  component: STRATEGY_EDIT
}, {
  id: "api-config",
  component: API_CONFIG
}, {
  id: "strategy-create-live",
  component: STRATEGY_CREATE-LIVE
}, {
  id: "strategy-create-backtest",
  component: STRATEGY_CREATE-BACKTEST
}]