import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { VisuallyHidden } from '@ariakit/react';
import type { TModelSpec } from 'librechat-data-provider';
import { useGetStartupConfig, useGetUserBalance } from '~/data-provider';
import { CustomMenuItem as MenuItem } from '../CustomMenu';
import { useModelSelectorContext } from '../ModelSelectorContext';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import SpecIcon from './SpecIcon';
import { cn } from '~/utils';

interface ModelSpecItemProps {
  spec: TModelSpec;
  isSelected: boolean;
}

export function ModelSpecItem({ spec, isSelected }: ModelSpecItemProps) {
  const localize = useLocalize();
  const { isAuthenticated } = useAuthContext();
  const { handleSelectSpec, endpointsConfig } = useModelSelectorContext();
  const { showIconInMenu = true } = spec;

  const { data: startupConfig } = useGetStartupConfig();
  const balanceEnabled = !!startupConfig?.balance?.enabled;
  const specBalanceEnabled = spec.balance?.enabled === true;

  const { data: balanceData } = useGetUserBalance({
    enabled: !!isAuthenticated && balanceEnabled && specBalanceEnabled,
  });

  const credits = specBalanceEnabled
    ? (balanceData?.perModelSpecTokenCredits?.[spec.name] ?? 0)
    : null;

  const requestCreditsUrl = spec.balance?.requestCreditsUrl;
  const showRequestCredits =
    specBalanceEnabled && credits !== null && credits <= 0 && !!requestCreditsUrl;

  return (
    <MenuItem
      key={spec.name}
      onClick={() => !showRequestCredits && handleSelectSpec(spec)}
      aria-selected={isSelected || undefined}
      className={cn(
        'flex w-full cursor-pointer items-center justify-between rounded-lg px-2 text-sm',
        showRequestCredits ? 'pointer-events-none' : ''
      )}
    >
      <div
        className={cn(
          'flex w-full min-w-0 gap-2 px-1 py-1',
          spec.description ? 'items-start' : 'items-center',
          showRequestCredits ? 'opacity-30' : 'opacity-100'
        )}
      >
        {showIconInMenu && (
          <div className="flex-shrink-0">
            <SpecIcon currentSpec={spec} endpointsConfig={endpointsConfig} />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-left">{spec.label}</span>
          {spec.description && (
            <span className="break-words text-xs font-normal">{spec.description}</span>
          )}
        </div>
      </div>
      {showRequestCredits ? (
        <a
          href={requestCreditsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-2 flex shrink-0 items-center gap-1 self-center text-xs pointer-events-auto hover:underline"
          aria-label={localize('com_ui_request_credits')}
        >
          <svg style={{
            width: '1.5em',
            height: '1.5em'
          }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M296 88C296 74.7 306.7 64 320 64C333.3 64 344 74.7 344 88L344 128L400 128C417.7 128 432 142.3 432 160C432 177.7 417.7 192 400 192L285.1 192C260.2 192 240 212.2 240 237.1C240 259.6 256.5 278.6 278.7 281.8L370.3 294.9C424.1 302.6 464 348.6 464 402.9C464 463.2 415.1 512 354.9 512L344 512L344 552C344 565.3 333.3 576 320 576C306.7 576 296 565.3 296 552L296 512L224 512C206.3 512 192 497.7 192 480C192 462.3 206.3 448 224 448L354.9 448C379.8 448 400 427.8 400 402.9C400 380.4 383.5 361.4 361.3 358.2L269.7 345.1C215.9 337.5 176 291.4 176 237.1C176 176.9 224.9 128 285.1 128L296 128L296 88z" fill="currentColor"/></svg>
          {localize('com_ui_request_credits')}
        </a>
      ) : (
        isSelected && (
          <>
            <CheckCircle2
              className="size-4 shrink-0 self-center text-text-primary"
              aria-hidden="true"
            />
            <VisuallyHidden>{localize('com_a11y_selected')}</VisuallyHidden>
          </>
        )
      )}
    </MenuItem>
  );
}

export function renderModelSpecs(specs: TModelSpec[], selectedSpec: string) {
  if (!specs || specs.length === 0) {
    return null;
  }

  return specs.map((spec) => (
    <ModelSpecItem key={spec.name} spec={spec} isSelected={selectedSpec === spec.name} />
  ));
}
