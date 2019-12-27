/* menu: /icc/roles */

import React, {
  Component,
} from 'react';
import {
  Balloon,
  Icon,
  Tree,
} from '@bone/next';
import {
  findIndex,
  isEqual,
  union,
  uniq,
  difference,
  includes,
} from 'lodash';
import PropTypes from 'prop-types';

import AppPermNode from './AppPermNode';
import Services from '../../service/Roles';
import styles from './index.scss';

const { Node: TreeNode } = Tree;

const AC_KEY = 'ApplicationCenter';

const APP_REG = /_APPLICATION_/i;

function auid(item, actionCode) {
  return `${item.resCode}|${actionCode || item.actionCode}`;
}

function getAllApps(apps, includesParent = true) {
  const keys = [];
  const loopp = (app) => {
    if (!app) return;
    const hasChild = app.children && app.children.length > 0;
    if (includesParent || !hasChild) {
      keys.push(app);
    }
    if (hasChild) {
      app.children.forEach((o) => {
        loopp(o);
      });
    }
  };
  apps.forEach(n => loopp(n));
  return keys;
}

const getUnCheckedKeys = (apps, checkedKeys) => {
  const allApps = getAllApps(apps);
  const allAppCodes = (allApps || []).map(app => app.resCode);
  const checkedCodes = (checkedKeys || []).map(item => item.split('|')[0]);
  const uncheckedCodes = uniq(difference(allAppCodes, checkedCodes));
  const normalUncheckedKeys = (uncheckedCodes || []).map(code => auid({ resCode: code }, 'NORMAL'));
  const adminUncheckedKeys = (uncheckedCodes || []).map(code => auid({ resCode: code }, 'ADMIN'));
  return [...(normalUncheckedKeys || []), ...(adminUncheckedKeys || [])];
};

class AppPermManagement extends Component {
  constructor(props) {
    super(props);

    const { rolePermList } = props;
    this.state = {
      allApps: [],
      checkedKeys: rolePermList
        ? rolePermList.filter(o => APP_REG.test(o.resCode)).map(o => auid(o))
        : [],
    };

    this.treeRef = React.createRef();

    this.getAllApps();
  }

  componentWillReceiveProps(nextProps) {
    const { rolePermList } = nextProps;
    if (isEqual(rolePermList, this.props.rolePermList)) return;
    const permCodes = rolePermList
      ? rolePermList.filter(o => APP_REG.test(o.resCode)).map(o => auid(o))
      : [];
    this.setState({
      checkedKeys: union(this.state.checkedKeys, permCodes),
    });
  }

  onCheck = (keys) => {
    const { allApps, checkedKeys } = this.state;
    const oldCheckedCodes = checkedKeys.map(o => o.split('|')[0]);
    const newAddedCodes = difference(keys, oldCheckedCodes);
    const newDeleteCodes = difference(oldCheckedCodes, keys);
    // 新选中的
    const newAddedKeys = newAddedCodes.map(key => auid({ resCode: key }, 'NORMAL'));
    // 被删除的
    const newDeletedKeys = checkedKeys.filter(o => includes(newDeleteCodes, o.split('|')[0]));
    // 之前选中的保留原来的选中状态
    const oldCheckedKeys = checkedKeys.filter(o => !includes(newDeletedKeys, o));
    const newCheckedKeys = [...newAddedKeys, ...oldCheckedKeys];
    const uncheckedKeys = getUnCheckedKeys(allApps, newCheckedKeys);
    this.setState({
      checkedKeys: newCheckedKeys,
      uncheckedKeys,
    });

    if (this.props.onChange) {
      this.props.onChange({
        checkedKeys: newCheckedKeys,
        uncheckedKeys,
      });
    }
  };

  onRadioChange = (node, actionCode) => {
    // 查询全量数据并上报
    const { checkedKeys, allApps } = this.state;
    // 查找是否之前已经选中，即这个应用是否已经有使用权限或者管理权限
    const index = findIndex(checkedKeys, code => code.split('|')[0] === node.resCode);
    let newCheckedKeys = checkedKeys;
    let oldUnCheckKeys = [];
    if (index < 0) {
      newCheckedKeys = [...(checkedKeys || []), auid(node, actionCode)];
    } else {
      newCheckedKeys[index] = auid(node, actionCode);
      if (actionCode === 'NORMAL') {
        oldUnCheckKeys = [auid(node, 'ADMIN')];
      } else {
        oldUnCheckKeys = [auid(node, 'NORMAL')];
      }
    }

    const uncheckedKeys = getUnCheckedKeys(allApps, newCheckedKeys);
    this.setState({
      uncheckedKeys: [...uncheckedKeys, ...oldUnCheckKeys],
      checkedKeys: newCheckedKeys,
    }, () => {
      if (this.props.onChange) {
        this.props.onChange({
          checkedKeys: this.state.checkedKeys,
          uncheckedKeys: this.state.uncheckedKeys,
        });
      }
    });
  };

  getAllApps() {
    const apiCalls = [
      Services.queryAllApps(),
      Services.queryAllAppPerms(),
    ];
    Promise.all(apiCalls).then(([allApps, allAppPerms]) => {
      // 获取有效 SaaS 应用
      const validApps = allApps.filter(o => o.isSaaS === 1 && o.appStatus === 'USING');
      this.setState({
        allApps: validApps.map((app) => {
          // 查找应用授权
          const index = findIndex(allAppPerms, perm => app.appId === perm.appId);
          if (index < 0) return null;
          return {
            ...app,
            ...allAppPerms[index],
            children: [allAppPerms[index]],
          };
        }).filter(o => !!o),
      });
    });
  }

  renderTreeNode(node) {
    const { checkedKeys = [] } = this.state;
    const index = findIndex(checkedKeys, code => code.split('|')[0] === node.resCode);

    return (
      <AppPermNode
        label={node.appName}
        onRadioChange={this.onRadioChange}
        isChecked={index >= 0}
        value={index >= 0 ? checkedKeys[index].split('|')[1] : null}
        node={node}
      />
    );
  }

  renderContent() {
    const { allApps, checkedKeys = [] } = this.state;

    if (!allApps || allApps.length <= 0) {
      return <div className={styles['no-perm']}>(暂无已启用应用)</div>;
    }

    const loop = (data, level) => {
      if (!data || data.length <= 0) return null;
      return data.map((item) => {
        const hasChild = item.children && item.children.length > 0;
        const children = loop(item.children, level + 1);
        return (
          <TreeNode
            label={level >= 2 ? this.renderTreeNode(item) : item.appName}
            className={styles[`level-${level}`]}
            key={item.resCode}
          >
            {hasChild ? children : null}
          </TreeNode>
        );
      }).filter(o => !!o);
    };

    const treeSource = {
      appName: '应用中心',
      resCode: AC_KEY,
      children: allApps,
    };
    const children = loop([treeSource], 0);
    return (
      <div className={styles.tree}>
        <Tree
          defaultExpandAll
          selectable={false}
          showLine
          checkable
          checkedKeys={checkedKeys.map(key => key.split('|')[0])}
          onCheck={this.onCheck}
          ref={this.treeRef}
        >
          { children }
        </Tree>
      </div>
    );
  }

  render() {
    return (
      <div className={styles.apps} id="icc-app-perm">
        <div className={styles.title}>
          <span>应用权限</span>
          <span className={styles.tip}>配置当前角色可访问应用中心哪些应用，以及对应用拥有的是管理权限还是使用权限</span>
          <Balloon
            closable={false}
            trigger={<Icon type="help" size="small" style={{ marginLeft: 8, color: '#D8D8D8' }} />}
            align="bl"
            triggerType="hover"
            popupContainer="icc-app-perm"
            className={styles.balloon}
            offset={[18, 0]}
          >
            <img alt="" src="//img.alicdn.com/tfs/TB1I_7tnRnTBKNjSZPfXXbf1XXa-1000-450.png" width={500} />
          </Balloon>
        </div>
        <div className={styles.perm}>
          { this.renderContent() }
        </div>
      </div>
    );
  }
}

AppPermManagement.defaultProps = {
  onChange: () => {},
  roleInfo: {},
  rolePermList: [],
};

AppPermManagement.propTypes = {
  onChange: PropTypes.func,
  roleInfo: PropTypes.shape({
    roleCode: PropTypes.string,
    roleName: PropTypes.string,
  }),
  rolePermList: PropTypes.arrayOf(PropTypes.any),
};

export default AppPermManagement;
