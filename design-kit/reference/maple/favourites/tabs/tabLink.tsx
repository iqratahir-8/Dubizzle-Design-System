import React from 'react';
import { TabRenderProps } from 'strat/generic';
import { Link } from 'strat/navigation';

const TabLink = ({ tab, className, onClick }: TabRenderProps<{ route: string }>) => (
    <Link
        route={tab.route}
        title={tab.name}
        key={tab.route}
        hard={tab.hard}
        onClick={onClick}
        className={className}
    >
        <span>{tab.name}</span>
    </Link>
);

export default TabLink;
