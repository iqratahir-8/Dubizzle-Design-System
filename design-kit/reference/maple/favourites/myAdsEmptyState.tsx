import { t } from '@lingui/macro';
import * as React from 'react';
import { useI18n } from 'strat/i18n/language';
import { Flex, Text } from 'strat/components';

import EmptyAdWEBP from '@app/assets/images/emptyAd.webp';
import EmptyAdPNG from '@app/assets/images/emptyAd.png';

import styles from './styles/myAdsEmptyState.cssm';

const MyAdsEmptyState = () => {
    const i18n = useI18n();
    const message = t(i18n)`No Ads`;

    return (
        <Flex column justifyCenter alignCenter className={styles.container}>
            <picture>
                <source srcSet={EmptyAdWEBP} type="image/webp" />
                <img className={styles.image} src={EmptyAdPNG} alt="" />
            </picture>
            <Text.Large>{message}</Text.Large>
        </Flex>
    );
};

export default MyAdsEmptyState;
