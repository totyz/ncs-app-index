/* Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

import classNames from 'classnames';
import Markdown from 'react-markdown';
import {
    LawIcon,
    LinkExternalIcon,
    TerminalIcon,
    VerifiedIcon,
    BookIcon,
    LockIcon,
    RepoIcon,
    OrganizationIcon,
} from '@primer/octicons-react';

import { useState } from 'react';
import { NormalisedApp } from '../schema';
import VSCodeButton from './VSCodeButton';
import TagList from './TagList';
import ReleasesDropDownList from './ReleasesDropDownList';
import VSCodeQueryParams from './VSCodeQueryParams';
import { AppDetails } from './Root';
import { telemetry } from './telemetry';
import { ShowAppGuideEvent, OpenDocsEvent, ShowSupportInfoEvent } from './telemetryEvents';

interface Props {
    app: NormalisedApp;
    setShowingAppDetails: (showingAppDetails: AppDetails) => void;
}

function Avatar({ app, sizeInPx }: { app: NormalisedApp; sizeInPx?: number }) {
    const src = app.avatar ?? app.owner.avatar;
    sizeInPx ??= 96; // Rendered size is 48px, so for nice retina quality we need an icon of size 96px

    try {
        if (src) {
            const { origin, pathname } = new URL(src);
            return <img src={`${origin}${pathname}?s=${sizeInPx}&v=4`} className="h-12 w-12" />;
        }
    } catch {
        // URL might be invalid
    }

    return <RepoIcon size={48} />;
}

function AppBlock({ app, setShowingAppDetails }: Props): JSX.Element {
    const [queryParams, setQueryParams] = useState(new VSCodeQueryParams(app));

    return (
        <li className="flex w-full max-w-5xl flex-col gap-3 border border-gray-300 bg-white p-3 lg:w-2/3">
            <div className="flex gap-3">
                <Avatar app={app} />

                <div className="flex flex-grow flex-col gap-2 md:gap-0">
                    <div className="flex flex-wrap items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-3 md:block">
                                <h1 className="text-xl text-gray-600">{app.title ?? app.name}</h1>
                            </div>
                            <a href={app.repo} target="_blank" title="Visit Website">
                                <LinkExternalIcon className="hoverable-icon" size={20} />
                            </a>
                            {app.restricted && (
                                <a
                                    href={app.restricted.detailsUrl}
                                    target="_blank"
                                    rel={'noopener noreferrer'}
                                    title="This add-on requires additional permissions."
                                >
                                    <LockIcon className="hoverable-icon" size={20} />
                                </a>
                            )}
                        </div>

                        <div className="hidden items-center gap-2 md:flex">
                            <TagList app={app} />
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <h2 className="text-md text-gray-600" title={app.owner.kind}>
                            {app.owner.name}
                        </h2>

                        {app.owner.kind !== 'External' && (
                            <VerifiedIcon
                                className={classNames({
                                    'text-[#00A9CE]': app.owner.kind === 'Nordic Semiconductor',
                                })}
                            />
                        )}

                        {app.testStatus &&
                            <div className="mx-2">
                                <img src={`${app.testStatus.badge}`} className="" />
                            </div>
                        }
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-x-2 gap-y-0 md:hidden">
                <TagList app={app} />
            </div>

            <Markdown disallowedElements={['img']} className="description">
                {app.description}
            </Markdown>

            <div className="flex flex-wrap items-center gap-2">
                <ReleasesDropDownList
                    app={app}
                    onReleaseChosen={(branch) => {
                        const newQueryParams = new VSCodeQueryParams(app);
                        newQueryParams.branch = branch!;
                        setQueryParams(newQueryParams);
                    }}
                />

                <VSCodeButton queryParams={queryParams} />

                <button
                    className="button bg-[#768692] text-white"
                    onClick={() => {
                        telemetry.trackEvent(
                            new ShowAppGuideEvent(app.name, queryParams.branch, app.owner.name),
                        );
                        setShowingAppDetails({
                            id: app.id,
                            sha: queryParams.branch,
                            type: 'instruction',
                        });
                    }}
                    title={`Open a guide for the '${app.name}'`}
                >
                    Instructions <TerminalIcon size={20} />
                </button>

                {!!app.docsUrl && (
                    <a
                        className="button bg-[#768692] text-white"
                        href={app.docsUrl}
                        title={`Open documentation for ${app.name}`}
                        target={'_blank'}
                        rel={'noopener noreferrer'}
                        onClick={() =>
                            telemetry.trackEvent(new OpenDocsEvent(app.name, app.owner.name))
                        }
                    >
                        Documentation <BookIcon size={20} />
                    </a>
                )}

                <button
                    className="button bg-[#768692] text-white"
                    onClick={() => {
                        telemetry.trackEvent(
                            new ShowSupportInfoEvent(app.name, queryParams.branch, app.owner.name),
                        );
                        setShowingAppDetails({
                            id: app.id,
                            sha: queryParams.branch,
                            type: 'support',
                        });
                    }}
                    title={`Show support information for the ${app.title ?? app.name}`}
                >
                    Support <OrganizationIcon size={20} />
                </button>
            </div>

            <div className="flex w-full px-1 gap-5 text-xs text-gray-600">
                {app.license && (
                    <div className="flex items-center gap-1">
                        <LawIcon /> {app.license}
                    </div>
                )}
            </div>
        </li>
    );
}

export default AppBlock;
